// Stryker disable all

import { once } from "node:events";
import fs from "node:fs/promises";
import nodePath from "node:path";

import { type FSWatcher, watch as chokidarWatch } from "chokidar";
import ts from "typescript";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { CHOKIDAR_OPTIONS } from "./constants.js";

export class Transpiler extends EventTarget {
  private readonly sourcePath: string;

  private readonly destinationPath: string;

  private watcher: FSWatcher | undefined;

  public constructor(sourcePath: string, destinationPath: string) {
    super();
    this.sourcePath = sourcePath;
    this.destinationPath = destinationPath;
  }

  public async watch(): Promise<void> {
    this.watcher = chokidarWatch(`${this.sourcePath}/**/*.{ts,mts,js,mjs}`, {
      ...CHOKIDAR_OPTIONS,
      ignored: `${this.sourcePath}/js`,
    });

    const transpiles: Promise<void>[] = [];

    this.watcher.on(
      "all",

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (eventName: string, sourcePathOriginal: string) => {
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

    // eslint-disable-next-line import/no-named-as-default-member
    const result: string = ts.transpileModule(source, {
      // eslint-disable-next-line import/no-named-as-default-member
      compilerOptions: { module: ts.ModuleKind.ES2022 },
    }).outputText;

    const fullDestination = nodePath
      .join(
        sourcePath
          .replace(this.sourcePath, this.destinationPath)
          .replace(".ts", ".mjs"),
      )
      .replaceAll("\\", "/");

    try {
      // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
      await fs.writeFile(fullDestination, result);
    } catch {
      throw new Error("could not transpile");
    }

    this.dispatchEvent(new Event("write"));
  }
}
