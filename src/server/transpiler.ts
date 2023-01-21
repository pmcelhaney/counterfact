// Stryker disable all

import fs from "node:fs/promises";
import nodePath from "node:path";
import { constants as fsConstants } from "node:fs";
import { once } from "node:events";

import ts from "typescript";
import chokidar from "chokidar";

async function ensureDirectoryExists(filePath) {
  const directory = nodePath.dirname(filePath);

  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

export class Transpiler extends EventTarget {
  public constructor(sourcePath, destinationPath) {
    super();
    this.sourcePath = sourcePath;
    this.destinationPath = destinationPath;
  }

  public async watch() {
    this.watcher = chokidar.watch(`${this.sourcePath}/**/*.{ts,mts,js,mjs}`, {
      ignored: `${this.sourcePath}/js`,
    });

    const transpiles = [];

    this.watcher.on("all", async (eventName, sourcePath) => {
      const destinationPath = sourcePath
        .replace(this.sourcePath, this.destinationPath)
        .replace(".ts", ".js");

      if (["add", "change"].includes(eventName)) {
        transpiles.push(
          this.transpileFile(eventName, sourcePath, destinationPath)
        );
      }

      if (eventName === "unlink") {
        try {
          await fs.rm(destinationPath);
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }

        this.dispatchEvent(new Event("delete"));
      }
    });
    await once(this.watcher, "ready");

    await Promise.all(transpiles);
  }

  public async stopWatching() {
    await this.watcher?.close();
  }

  public async transpileFile(eventName, sourcePath, destinationPath) {
    await ensureDirectoryExists(destinationPath);

    const source = await fs.readFile(sourcePath, "utf8");

    const result = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2022 },
    }).outputText;

    try {
      await fs.writeFile(
        nodePath.join(
          sourcePath
            .replace(this.sourcePath, this.destinationPath)
            .replace(".ts", ".mjs")
        ),
        result
      );
    } catch {
      throw new Error("could not transpile");
    }

    this.dispatchEvent(new Event("write"));
  }
}
