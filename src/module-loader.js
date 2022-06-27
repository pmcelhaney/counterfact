/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable import/no-dynamic-require */
import fs from "node:fs/promises";
import path from "node:path";
import EventEmitter, { once } from "node:events";

import chokidar from "chokidar";

export class ModuleLoader extends EventEmitter {
  basePath;

  registry;

  watcher;

  constructor(basePath, registry) {
    super();
    this.basePath = basePath;
    this.registry = registry;
  }

  async watch() {
    if (this.watcher) {
      throw new Error("already watching");
    }

    this.watcher = chokidar
      .watch(`${this.basePath}/**/*.{js,mjs,ts,mts}`)
      .on("all", (event, pathName) => {
        if (!["add", "change", "unlink"].includes(event)) {
          return;
        }

        const parts = path.parse(pathName.replace(this.basePath, ""));
        const url = `/${path.join(parts.dir, parts.name)}`;

        if (parts.name.includes("#")) {
          return;
        }

        if (event === "unlink") {
          this.registry.remove(url);
          this.emit("remove", pathName);
        }

        import(`${pathName}?cacheBust=${Date.now()}`)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then((endpoint) => {
            this.registry.add(url, endpoint);
            this.emit(event, pathName);

            return "ok";
          })
          // eslint-disable-next-line promise/prefer-await-to-then
          .catch((error) => {
            throw new Error(String(error));
          });
      });
    await once(this.watcher, "ready");
  }

  async stopWatching() {
    await this.watcher?.close();
  }

  async load(directory = "") {
    const files = await fs.readdir(path.join(this.basePath, directory), {
      withFileTypes: true,
    });
    const imports = files.flatMap(async (file) => {
      if (file.name.includes("#")) {
        return;
      }

      // eslint-disable-next-line no-magic-numbers
      const extension = file.name.split(".").at(-1);

      if (!["js", "mjs", "ts", "mts"].includes(extension)) {
        return;
      }

      if (file.isDirectory()) {
        await this.load(path.join(directory, file.name));

        return;
      }

      const endpoint = await import(
        path.join(this.basePath, directory, file.name)
      );

      this.registry.add(
        `/${path.join(directory, path.parse(file.name).name)}`,
        endpoint
      );
    });

    await Promise.all(imports);
  }
}
