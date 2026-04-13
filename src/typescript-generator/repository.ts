import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import createDebug from "debug";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { CONTEXT_FILE_TOKEN } from "./context-file-token.js";
import { Script } from "./script.js";
import { escapePathForWindows } from "../util/windows-escape.js";

const debug = createDebug("counterfact:server:repository");

const __dirname = dirname(fileURLToPath(import.meta.url)).replaceAll("\\", "/");

debug("dirname is %s", __dirname);

interface WriteFilesOptions {
  routes?: boolean;
  types?: boolean;
  /** When false, skips copying the shared `counterfact-types` directory.
   * Set to `false` in multi-spec mode so the copy runs only once. */
  copyCoreFiles?: boolean;
}

/**
 * Copies the compiled `counterfact-types` directory from the Counterfact
 * distribution into the generated output tree.
 *
 * Returns `false` when the source directory does not exist (e.g. running
 * from source without a prior build).
 *
 * @param destination - The root of the generated output tree.
 */
export async function copyCoreFiles(
  destination: string,
): Promise<boolean | void> {
  const sourcePath = nodePath.join(
    __dirname,
    "../../dist/server/counterfact-types",
  );
  const destinationPath = nodePath.join(destination, "counterfact-types");

  if (!existsSync(sourcePath)) {
    return false;
  }

  return fs.cp(sourcePath, destinationPath, { recursive: true });
}

/**
 * Collection of {@link Script} objects keyed by their repository-relative
 * path.
 *
 * Coders call {@link get} to obtain (or create) the script where they should
 * export their generated TypeScript.  After all coders have been registered,
 * {@link writeFiles} waits for every script to finish and writes the output to
 * disk.
 */
export class Repository {
  public scripts: Map<string, Script>;

  public constructor() {
    this.scripts = new Map();
  }

  /**
   * Returns the {@link Script} for `path`, creating it if it does not yet
   * exist.
   *
   * @param path - Repository-relative path (e.g. `"routes/pets.ts"`).
   */
  public get(path: string): Script {
    debug("getting script at %s", path);

    if (this.scripts.has(path)) {
      debug("already have script %s, returning it", path);

      return this.scripts.get(path)!;
    }

    debug("don't have %s, creating it", path);

    const script = new Script(this, path);

    this.scripts.set(path, script);

    return script;
  }

  /** Waits until all scripts have resolved all of their pending export promises. */
  public async finished(): Promise<void> {
    while (
      Array.from(this.scripts.values()).some((script) => script.isInProgress())
    ) {
      debug("waiting for %i scripts to finish", this.scripts.size);

      await Promise.all(
        Array.from(this.scripts.values(), (script) => script.finished()),
      );
    }
  }

  /**
   * Copies the compiled `counterfact-types` directory from the Counterfact
   * distribution into the generated output tree.
   *
   * Returns `false` when the source directory does not exist (e.g. running
   * from source without a prior build).
   *
   * @param destination - The root of the generated output tree.
   * @deprecated Use the standalone `copyCoreFiles` function instead.
   */
  public async copyCoreFiles(destination: string): Promise<boolean | void> {
    return copyCoreFiles(destination);
  }

  /**
   * Waits for all scripts to finish, then writes each one to disk.
   *
   * Route files (`routes/…`) are never overwritten if they already exist on
   * disk, preserving user edits.  Type files (`types/…`) are always
   * overwritten.
   *
   * @param destination - Absolute path to the output root directory.
   * @param options - Controls which artefacts are written.
   */
  public async writeFiles(
    destination: string,
    {
      routes,
      types,
      copyCoreFiles: shouldCopyCoreFiles = true,
    }: WriteFilesOptions,
  ): Promise<void> {
    debug(
      "waiting for %i or more scripts to finish before writing files",
      this.scripts.size,
    );
    await this.finished();
    debug("all %i scripts are finished", this.scripts.size);

    const writeFiles = Array.from(
      this.scripts.entries(),

      async ([path, script]) => {
        const contents = await script.contents();

        const fullPath = escapePathForWindows(
          nodePath.join(destination, path).replaceAll("\\", "/"),
        );

        await ensureDirectoryExists(fullPath);

        const shouldWriteRoutes = routes && path.startsWith("routes");
        const shouldWriteTypes = types && !path.startsWith("routes");

        if (
          shouldWriteRoutes &&
          (await fs
            .stat(fullPath)
            .then((stat) => stat.isFile())
            .catch(() => false))
        ) {
          debug(`not overwriting ${fullPath}\n`);

          return;
        }

        if (shouldWriteRoutes || shouldWriteTypes) {
          debug("about to write", fullPath);
          await fs.writeFile(
            fullPath,
            contents.replaceAll(
              CONTEXT_FILE_TOKEN,
              this.findContextPath(destination, path),
            ),
          );
          debug("did write", fullPath);
        }
      },
    );

    await Promise.all(writeFiles);

    if (shouldCopyCoreFiles) {
      await this.copyCoreFiles(destination);
    }

    if (routes) {
      await this.createDefaultContextFile(destination);
    }
  }

  /**
   * Creates the default `routes/_.context.ts` file if it does not already
   * exist.
   *
   * @param destination - Absolute path to the output root directory.
   */
  public async createDefaultContextFile(destination: string): Promise<void> {
    const contextFilePath = nodePath.join(
      destination,
      "routes",
      "_.context.ts",
    );

    if (existsSync(contextFilePath)) {
      return;
    }

    await ensureDirectoryExists(contextFilePath);

    await fs.writeFile(
      contextFilePath,
      `import type { Context$ } from "../types/_.context.js";

/**
 * This is the default context for Counterfact.
 *
 * It defines the context object in the REPL
 * and the $.context object in the code.
 *
 * Add properties and methods to suit your needs.
 *
 * See https://github.com/counterfact/api-simulator/blob/main/docs/features/state.md
 */

export class Context {
  constructor($: Context$) {
    void $;
  }
}
`,
    );
  }

  /**
   * Returns the path of the `_.context.ts` file that is nearest to `path` in
   * the directory hierarchy, relative to the script's output directory.
   *
   * @param destination - Output root directory.
   * @param path - Repository-relative path of the script being generated.
   */
  public findContextPath(destination: string, path: string): string {
    return nodePath
      .relative(
        nodePath.join(destination, nodePath.dirname(path)),
        this.nearestContextFile(destination, path),
      )
      .replaceAll("\\", "/");
  }

  /**
   * Walks up the directory tree from `path` to find the nearest
   * `_.context.ts` file, falling back to `routes/_.context.ts` at the root.
   *
   * @param destination - Output root directory.
   * @param path - Repository-relative path to start from.
   */
  public nearestContextFile(destination: string, path: string): string {
    const directory = nodePath
      .dirname(path)
      .replaceAll("\\", "/")
      .replace("types/paths", "routes");

    const candidate = nodePath.join(destination, directory, "_.context.ts");

    if (directory.length <= 1) {
      // No _context.ts was found so import the one that should be in the root
      return nodePath.join(destination, "routes", "_.context.ts");
    }

    if (existsSync(candidate)) {
      return candidate;
    }

    return this.nearestContextFile(destination, nodePath.join(path, ".."));
  }
}
