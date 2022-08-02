import fs from "node:fs/promises";
import nodePath from "node:path";
import { once } from "node:events";

import chokidar from "chokidar";

export class ModuleLoader extends EventTarget {
  basePath;

  registry;

  watcher;

  constructor(basePath, registry) {
    super();
    this.basePath = basePath;
    this.registry = registry;
  }

  async watch() {
    this.watcher = chokidar
      .watch(`${this.basePath}/**/*.{js,mjs,ts,mts}`)
      .on("all", (eventName, pathName) => {
        if (!["add", "change", "unlink"].includes(eventName)) {
          return;
        }

        const parts = nodePath.parse(pathName.replace(this.basePath, ""));
        const url = `/${nodePath.join(parts.dir, parts.name)}`;

        if (parts.name.includes("#")) {
          return;
        }

        if (eventName === "unlink") {
          this.registry.remove(url);
          this.dispatchEvent(new Event("remove"), pathName);
        }

        // eslint-disable-next-line node/no-unsupported-features/es-syntax, import/no-dynamic-require
        import(`${pathName}?cacheBust=${Date.now()}`)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then((endpoint) => {
            this.registry.add(url, endpoint);
            this.dispatchEvent(new Event(eventName), pathName);

            return "ok";
          })
          // eslint-disable-next-line promise/prefer-await-to-then
          .catch((error) => {
            throw error;
          });
      });
    await once(this.watcher, "ready");
  }

  async stopWatching() {
    await this.watcher?.close();
  }

  async load(directory = "") {
    const files = await fs.readdir(nodePath.join(this.basePath, directory), {
      withFileTypes: true,
    });
    const imports = files.flatMap(async (file) => {
      if (file.name.includes("#")) {
        return;
      }

      const extension = file.name.split(".").at(-1);

      if (file.isDirectory()) {
        await this.load(nodePath.join(directory, file.name));

        return;
      }

      if (!["js", "mjs", "ts", "mts"].includes(extension)) {
        return;
      }

      // eslint-disable-next-line node/no-unsupported-features/es-syntax, import/no-dynamic-require
      const endpoint = await import(
        nodePath.join(this.basePath, directory, file.name)
      );

      this.registry.add(
        `/${nodePath.join(directory, nodePath.parse(file.name).name)}`,
        endpoint
      );
    });

    await Promise.all(imports);
  }
}
