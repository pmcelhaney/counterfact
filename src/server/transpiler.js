// Stryker disable all

import fs from "node:fs/promises";
import nodePath from "node:path";
import { existsSync, constants as fsConstants } from "node:fs";
import { once } from "node:events";

import ts from "typescript";
import chokidar from "chokidar";

import { CHOKIDAR_OPTIONS } from "./constants.js";

function log(...strings) {
  process.stdout.write(`[transpiler] ${strings.join("\t")}\n`);
}

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
      ignored: `${this.sourcePath}/js`,
      CHOKIDAR_OPTIONS,
    });

    const transpiles = [];

    // eslint-disable-next-line max-statements
    this.watcher.on("all", async (eventName, sourcePathOriginal) => {
      const sourcePath = sourcePathOriginal.replaceAll("\\", "/");

      const destinationPath = sourcePath
        .replace(this.sourcePath, this.destinationPath)
        .replaceAll("\\", "/")
        .replace(".ts", ".js");

      log("chokidar", eventName, sourcePath, destinationPath);

      if (["add", "change"].includes(eventName)) {
        transpiles.push(
          this.transpileFile(eventName, sourcePath, destinationPath)
        );
      }

      if (eventName === "unlink") {
        try {
          log("removing", destinationPath);
          await fs.rm(destinationPath);
        } catch (error) {
          if (error.code !== "ENOENT") {
            log("ERROR: could not remove", destinationPath, error);

            throw error;
          }
        }

        this.dispatchEvent(new Event("delete"));
      }
    });

    log("waiting for watcher to be ready");
    await once(this.watcher, "ready");
    log("watcher is ready");

    log("waiting until", transpiles.length, "files are transpiled");

    await Promise.all(transpiles);

    log("done transpiling", transpiles.length, "files");
  }

  async stopWatching() {
    await this.watcher?.close();
  }

  // eslint-disable-next-line max-statements
  async transpileFile(eventName, sourcePath, destinationPath) {
    log("transpiling", sourcePath, "to", destinationPath, "because", eventName);
    log("first make sure the directory exists for", destinationPath);
    await ensureDirectoryExists(destinationPath);
    log("the directory does exist for", destinationPath);

    const source = await fs.readFile(sourcePath, "utf8");

    const result = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ES2022 },
    }).outputText;

    const fullDestination = nodePath
      .join(
        sourcePath
          .replace(this.sourcePath, this.destinationPath)
          .replace(".ts", ".mjs")
      )
      .replaceAll("\\", "/");

    log("starting transpilation for", fullDestination);

    try {
      await fs.writeFile(fullDestination, result);
    } catch (error) {
      log("ERROR: could not transpile", fullDestination, error);

      throw new Error("could not transpile");
    }

    log("finished transpilation for", fullDestination);

    log("is the file there?", existsSync(fullDestination));
    this.dispatchEvent(new Event("write"));
  }
}
