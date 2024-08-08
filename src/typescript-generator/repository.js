/* eslint-disable n/no-sync */
/* eslint-disable max-statements */
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import createDebug from "debug";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { CONTEXT_FILE_TOKEN } from "./context-file-token.js";
import { Script } from "./script.js";

const debug = createDebug("counterfact:server:repository");

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url)).replaceAll("\\", "/");

debug("dirname is %s", __dirname);

export class Repository {
  constructor() {
    this.scripts = new Map();
  }

  get(path) {
    debug("getting script at %s", path);

    if (this.scripts.has(path)) {
      debug("already have script %s, returning it", path);

      return this.scripts.get(path);
    }

    debug("don't have %s, creating it", path);

    const script = new Script(this, path);

    this.scripts.set(path, script);

    return script;
  }

  async finished() {
    while (
      Array.from(this.scripts.values()).some((script) => script.isInProgress())
    ) {
      debug("waiting for %i scripts to finish", this.scripts.size);
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        Array.from(this.scripts.values(), (script) => script.finished()),
      );
    }
  }

  async copyCoreFiles(destination) {
    const sourcePath = nodePath.join(__dirname, "../../dist/server/types.ts");
    const destinationPath = nodePath.join(destination, "types.ts");

    if (!existsSync(sourcePath)) {
      return false;
    }

    await ensureDirectoryExists(destination);

    return fs.copyFile(sourcePath, destinationPath);
  }

  async writeFiles(destination, { routes, types }) {
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

        const fullPath = nodePath.join(destination, path).replaceAll("\\", "/");

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

    await this.copyCoreFiles(destination);

    if (routes) {
      await this.createDefaultContextFile(destination);
    }
  }

  async createDefaultContextFile(destination) {
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
      `/**
* This is the default context for Counterfact.
*
* It defines the context object in the REPL 
* and the $.context object in the code.
*
* Add properties and methods to suit your needs.
* 
* See https://counterfact.dev/docs/usage.html#working-with-state-the-codecontextcode-object-and-codecontexttscode
*/
export class Context {

}
`,
    );
  }

  findContextPath(destination, path) {
    return nodePath
      .relative(
        nodePath.join(destination, nodePath.dirname(path)),
        this.nearestContextFile(destination, path),
      )
      .replaceAll("\\", "/");
  }

  nearestContextFile(destination, path) {
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
