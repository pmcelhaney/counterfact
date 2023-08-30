// Stryker disable all

import { once } from "node:events";
import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import nodePath from "node:path";

import chokidar from "chokidar";
import ts from "typescript";

import { CHOKIDAR_OPTIONS } from "./constants.js";

async function ensureDirectoryExists(filePath) {
  const directory = nodePath.dirname(filePath);

  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

export class Transpiler extends EventTarget {
  constructor(sourcePath, destinationPath) {
    super();
    this.sourcePath = sourcePath;
    this.destinationPath = destinationPath;
  }

  async watch() {
    this.watcher = chokidar.watch(`${this.sourcePath}/**/*.{ts,mts,js,mjs}`, {
      CHOKIDAR_OPTIONS,
      ignored: `${this.sourcePath}/js`,
    });

    const transpiles = [];

    this.watcher.on("all", async (eventName, sourcePathOriginal) => {
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

  async stopWatching() {
    await this.watcher?.close();
  }

  async transpileFile(eventName, sourcePath, destinationPath) {
    await ensureDirectoryExists(destinationPath);

    const source = await fs.readFile(sourcePath, "utf8");

    const result = ts.transpileModule(source, {
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
      await fs.writeFile(fullDestination, result);
    } catch {
      throw new Error("could not transpile");
    }

    this.dispatchEvent(new Event("write"));
  }
}
