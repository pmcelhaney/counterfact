// Stryker disable all

import { once } from "node:events";
import fs from "node:fs/promises";

import { type FSWatcher, watch as chokidarWatch } from "chokidar";
import createDebug from "debug";
import ts from "typescript";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { CHOKIDAR_OPTIONS } from "./constants.js";
import { convertFileExtensionsToCjs } from "./convert-js-extensions-to-cjs.js";

const debug = createDebug("counterfact:server:transpiler");

/**
 * Watches TypeScript source files under `rootPath` and compiles them to
 * JavaScript using the TypeScript compiler API.
 *
 * Any `.ts` file found inside a `routes/` subdirectory of `rootPath` is
 * compiled; the output is written to the sibling `.cache/` directory so the
 * Counterfact module loader can require it.  For example:
 *
 *   {rootPath}/routes/pets.ts        → {rootPath}/.cache/pets.cjs
 *   {rootPath}/alpha/routes/pets.ts  → {rootPath}/alpha/.cache/pets.cjs
 *
 * Used when the runtime cannot execute TypeScript natively (i.e. Node.js
 * without the `--experimental-strip-types` flag).  Each file is compiled
 * independently (no type-checking) for maximum speed.
 *
 * Emits DOM-style events: `"write"` after a successful transpile, `"delete"`
 * after a source file is removed, and `"error"` on write or compilation errors.
 */
export class Transpiler extends EventTarget {
  private readonly rootPath: string;

  private readonly moduleKind: string;

  private watcher: FSWatcher | undefined;

  public constructor(rootPath: string, moduleKind: string) {
    super();
    this.rootPath = rootPath;
    this.moduleKind = moduleKind;
  }

  private get extension() {
    return this.moduleKind.toLowerCase() === "commonjs" ? ".cjs" : ".js";
  }

  /**
   * Derives the compiled output path for a given source path by replacing the
   * first `routes` path segment with `.cache` and swapping the TypeScript
   * extension for the target module extension.
   *
   * Only the first occurrence of `/routes/` is replaced so that a file at
   * `root/routes/sub/file.ts` maps to `root/.cache/sub/file.ts` (not
   * `root/.cache/sub/file.ts` with any inner `routes` segments also changed).
   */
  private destinationPath(sourcePath: string): string {
    return sourcePath
      .replace("/routes/", "/.cache/")
      .replace(/\.(ts|mts)$/u, this.extension);
  }

  /**
   * Starts the file-system watcher and transpiles all existing files under
   * `rootPath`.  Only files inside `routes/` subdirectories are compiled.
   * Resolves once the initial scan and all pending transpiles are complete.
   */
  public async watch(): Promise<void> {
    debug("transpiler: watch");
    this.watcher = chokidarWatch(this.rootPath, {
      ...CHOKIDAR_OPTIONS,
      ignored: /[/\\]\.cache([/\\]|$)/u,
      ignoreInitial: false,
    });

    const transpiles: Promise<void>[] = [];

    this.watcher.on(
      "all",

      async (eventName: string, sourcePathOriginal: string) => {
        debug("transpiler event: %s <%s>", eventName, sourcePathOriginal);

        const JS_EXTENSIONS = ["js", "mjs", "ts", "mts"];

        if (
          !JS_EXTENSIONS.some((extension) =>
            sourcePathOriginal.endsWith(`.${extension}`),
          )
        )
          return;

        const sourcePath = sourcePathOriginal.replaceAll("\\", "/");

        if (!sourcePath.includes("/routes/")) return;

        const destinationPath = this.destinationPath(sourcePath);

        if (["add", "change"].includes(eventName)) {
          transpiles.push(
            this.transpileFile(eventName, sourcePath, destinationPath),
          );
        }

        if (eventName === "unlink") {
          try {
            await fs.rm(destinationPath);
          } catch (error) {
            if ((error as { code: string }).code !== "ENOENT") {
              debug("error removing %s: %o", destinationPath, error);
              this.dispatchEvent(new Event("error"));

              throw error;
            }
          }

          this.dispatchEvent(new Event("delete"));
        }
      },
    );

    await once(this.watcher, "ready");

    await Promise.all(transpiles);
  }

  /** Closes the file-system watcher. */
  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }

  private async transpileFile(
    eventName: string,
    sourcePath: string,
    destinationPath: string,
  ): Promise<void> {
    ensureDirectoryExists(destinationPath);

    const source = await fs.readFile(sourcePath, "utf8");

    const transpileOutput = ts.transpileModule(source, {
      compilerOptions: {
        module:
          ts.ModuleKind[
            this.moduleKind.toLowerCase() === "module" ? "ES2022" : "CommonJS"
          ],

        target: ts.ScriptTarget.ES2015,
      },
      reportDiagnostics: true,
    });

    if (transpileOutput.diagnostics?.length) {
      for (const diagnostic of transpileOutput.diagnostics) {
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n",
        );
        debug("TypeScript diagnostic in %s: %s", sourcePath, message);
      }
    }

    const result: string = transpileOutput.outputText;

    const resultWithTransformedFileExtensions =
      convertFileExtensionsToCjs(result);

    try {
      await fs.writeFile(destinationPath, resultWithTransformedFileExtensions);
    } catch (error) {
      debug(
        "error writing transpiled output to %s: %o",
        destinationPath,
        error,
      );
      this.dispatchEvent(new Event("error"));

      throw new Error("could not transpile", { cause: error });
    }

    this.dispatchEvent(new Event("write"));
  }
}
