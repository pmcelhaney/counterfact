// Stryker disable all

import { once } from "node:events";
import fs from "node:fs/promises";
import nodePath from "node:path";

import { type FSWatcher, watch as chokidarWatch } from "chokidar";
import createDebug from "debug";
import ts from "typescript";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { CHOKIDAR_OPTIONS } from "./constants.js";

const debug = createDebug("counterfact:server:transpiler");
export class Transpiler extends EventTarget {
  private readonly sourcePath: string;

  private readonly destinationPath: string;

  private readonly moduleKind: string;

  private watcher: FSWatcher | undefined;

  public constructor(
    sourcePath: string,
    destinationPath: string,
    moduleKind: string,
  ) {
    super();
    this.sourcePath = sourcePath;
    this.destinationPath = destinationPath;
    this.moduleKind = moduleKind;
  }

  public async watch(): Promise<void> {
    debug("transpiler: watch");
    this.watcher = chokidarWatch(`${this.sourcePath}/**/*.{ts,mts,js,mjs}`, {
      ...CHOKIDAR_OPTIONS,
      ignored: `${this.sourcePath}/js`,
    });

    const transpiles: Promise<void>[] = [];

    this.watcher.on(
      "all",

      // eslint-disable-next-line @typescript-eslint/no-misused-promises, max-statements
      async (eventName: string, sourcePathOriginal: string) => {
        debug("transpiler event: %s <%s>", eventName, sourcePathOriginal);
        const sourcePath = sourcePathOriginal.replaceAll("\\", "/");

        const destinationPath = sourcePath
          .replace(this.sourcePath, this.destinationPath)
          .replaceAll("\\", "/")
          .replace(".ts", ".js");

        if (["add", "change"].includes(eventName)) {
          transpiles.push(
            this.transpileFile(eventName, sourcePath, destinationPath),
          );
        }

        if (eventName === "unlink") {
          try {
            await fs.rm(destinationPath);
          } catch (error) {
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

    /* eslint-disable import/no-named-as-default-member */
    const result: string = ts.transpileModule(source, {
      compilerOptions: {
        module:
          ts.ModuleKind[this.moduleKind === "module" ? "ES2022" : "CommonJS"],

        target: ts.ScriptTarget.ES2015,
      },
    }).outputText;
    /* eslint-enable import/no-named-as-default-member */

    const fullDestination = nodePath
      .join(
        sourcePath
          .replace(this.sourcePath, this.destinationPath)
          .replace(".ts", ".js"),
      )
      .replaceAll("\\", "/");

    try {
      await fs.writeFile(fullDestination, result);
    } catch {
      debug("error transpiling %s", fullDestination);
      this.dispatchEvent(new Event("error"));
      throw new Error("could not transpile");
    }

    this.dispatchEvent(new Event("write"));
  }
}
