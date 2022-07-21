import nodePath from "node:path";
import fs from "node:fs/promises";
import { constants as fsConstants, write } from "node:fs";

import prettier from "prettier";

import { Script } from "./script.js";

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
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        Array.from(this.scripts.values(), (script) => script.finished())
      );
    }
  }

  async writeFiles(destination) {
    await this.finished();

    const writeFiles = Array.from(
      this.scripts.entries(),
      async ([path, script]) => {
        const contents = prettier.format(script.contents(), {
          parser: "typescript",
        });

        const fullPath = nodePath.join(destination, path);

        await ensureDirectoryExists(fullPath);

        if (
          path.startsWith("paths") &&
          (await fs
            .stat(fullPath)
            .then((stat) => stat.isFile())
            .catch(() => false))
        ) {
          process.stdout.write("not overwriting", fullPath);

          return;
        }

        await fs.writeFile(fullPath, contents);

        process.stdout.write(`writing ${fullPath}\n`);
      }
    );

    await Promise.all(writeFiles);
  }
}
