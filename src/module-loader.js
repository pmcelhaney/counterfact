import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import nodePath from "node:path";
import { once } from "node:events";

import chokidar from "chokidar";

import { ModelRegistry } from "./model-registry.js";

export class ModuleLoader extends EventTarget {
  basePath;

  registry;

  watcher;

  modelRegistry;

  constructor(basePath, registry, modelRegistry = new ModelRegistry()) {
    super();
    this.basePath = basePath;
    this.registry = registry;
    this.modelRegistry = modelRegistry;
  }

  async watch() {
    this.watcher = chokidar
      .watch(`${this.basePath}/**/*.{js,mjs,ts,mts}`)
      .on("all", (eventName, pathName) => {
        if (!["add", "change", "unlink"].includes(eventName)) {
          return;
        }

        const parts = nodePath.parse(pathName.replace(this.basePath, ""));
        const url = nodePath.normalize(
          `/${nodePath.join(parts.dir, parts.name)}`
        );

        if (eventName === "unlink") {
          this.registry.remove(url);
          this.dispatchEvent(new Event("remove"), pathName);
        }

        // eslint-disable-next-line node/no-unsupported-features/es-syntax, import/no-dynamic-require
        import(`${pathName}?cacheBust=${Date.now()}`)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then((endpoint) => {
            if (pathName.includes("#model")) {
              this.modelRegistry.add(endpoint.model);

              return "model";
            }

            this.registry.add(url, endpoint);
            this.dispatchEvent(new Event(eventName), pathName);

            return "path";
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
    if (!existsSync(nodePath.join(this.basePath, directory))) {
      throw new Error(`Directory does not exist ${this.basePath}`);
    }

    const files = await fs.readdir(nodePath.join(this.basePath, directory), {
      withFileTypes: true,
    });

    const imports = files.flatMap(async (file) => {
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

      if (file.name.includes("#model")) {
        this.modelRegistry.add(`/${directory}`, endpoint.model);
      } else {
        this.registry.add(
          `/${nodePath.join(directory, nodePath.parse(file.name).name)}`,
          endpoint
        );
      }
    });

    await Promise.all(imports);
  }
}
