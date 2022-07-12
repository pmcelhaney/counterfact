import { join, dirname } from "node:path";
import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";

import prettier from "prettier";

import { Script } from "./script.js";

async function ensureDirectoryExists(filePath) {
  const directory = dirname(filePath);

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

  async writeFiles(destination) {
    while (
      Array.from(this.scripts.values()).some((script) => script.isInProgress())
    ) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        Array.from(this.scripts.values(), (script) => script.finished())
      );
    }

    // now everything is settled and we can write the files
    await Array.from(this.scripts.entries()).forEach(async ([path, script]) => {
      const contents = prettier.format(script.contents(), {
        parser: "typescript",
      });

      const fullPath = join(destination, path);

      await ensureDirectoryExists(fullPath);

      await fs.writeFile(fullPath, contents);

      console.log(`${path}:`);
      console.log("~~~~~~~~~~~~~~~~~~~~~~");

      console.log(contents);
      console.log("\n\n\n");
    });
  }
}
