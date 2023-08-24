import nodePath from "node:path";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import prettier from "prettier";
import createDebug from "debug";

import { Script } from "./script.js";

const debug = createDebug("counterfact:typescript-generator:repository");

// eslint-disable-next-line no-underscore-dangle
const __dirname = nodePath.dirname(new URL(import.meta.url).pathname);

async function ensureDirectoryExists(filePath) {
  const directory = nodePath.dirname(filePath);

  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

export class Repository {
  constructor() {
    this.scripts = new Map();
  }

  get(path) {
    if (this.scripts.has(path)) {
      return this.scripts.get(path);
    }

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
        Array.from(this.scripts.values(), (script) => script.finished())
      );
    }
  }

  copyCoreFiles(destination) {
    const files = ["package.json", "response-builder-factory.ts"];

    return files.map((file) => {
      const path = nodePath.join(destination, file).replaceAll("\\", "/");

      process.stdout.write(`writing ${path}\n`);

      return fs.copyFile(
        nodePath
          .join(__dirname, `../../templates/${file}`)
          .replaceAll("\\", "/"),
        path
      );
    });
  }

  async writeFiles(destination) {
    debug(
      "waiting for %i or more scripts to finish before writing files",
      this.scripts.size
    );
    await this.finished();
    debug("all %i scripts are finished", this.scripts.size);

    const writeFiles = Array.from(
      this.scripts.entries(),
      async ([path, script]) => {
        const contents = prettier.format(script.contents(), {
          parser: "typescript",
        });

        const fullPath = nodePath.join(destination, path).replaceAll("\\", "/");

        await ensureDirectoryExists(fullPath);

        if (
          path.startsWith("paths") &&
          (await fs
            .stat(fullPath)
            .then((stat) => stat.isFile())
            .catch(() => false))
        ) {
          process.stdout.write(`not overwriting ${fullPath}\n`);

          return;
        }

        debug("about to write", fullPath);
        await fs.writeFile(fullPath, contents);
        debug("did write", fullPath);

        process.stdout.write(`writing ${fullPath}\n`);
      }
    );

    await Promise.all(writeFiles);

    await this.copyCoreFiles(destination);
  }
}
