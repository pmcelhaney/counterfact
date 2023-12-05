import fs from "node:fs/promises";
import nodePath, { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import createDebug from "debug";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
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

  copyCoreFiles(destination) {
    return fs.copyFile(
      nodePath
        .join(__dirname, "../../dist/server/types.d.ts")
        .replaceAll("\\", "/"),
      nodePath.join(destination, "types.d.ts").replaceAll("\\", "/"),
    );
  }

  async writeFiles(destination) {
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

        if (
          path.startsWith("paths") &&
          (await fs
            .stat(fullPath)
            .then((stat) => stat.isFile())
            .catch(() => false))
        ) {
          debug(`not overwriting ${fullPath}\n`);

          return;
        }

        debug("about to write", fullPath);
        await fs.writeFile(fullPath, contents);
        debug("did write", fullPath);
      },
    );

    await Promise.all(writeFiles);

    await this.copyCoreFiles(destination);
  }
}
