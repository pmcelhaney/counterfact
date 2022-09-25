import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import nodePath from "node:path";
import { once } from "node:events";
import vm from "node:vm";

import chokidar from "chokidar";

import { ContextRegistry } from "./context-registry.js";

function escapePathForImport(path) {
  // If --experimental-vm-modules is enabled
  // (there may be a better way to detect this)
  if (vm.Module) {
    return path;
  }

  return escape(path);
}

export class ModuleLoader extends EventTarget {
  basePath;

  registry;

  watcher;

  contextRegistry;

  constructor(basePath, registry, contextRegistry = new ContextRegistry()) {
    super();
    this.basePath = basePath;
    this.registry = registry;
    this.contextRegistry = contextRegistry;
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
        import(`${escape(pathName)}?cacheBust=${Date.now()}`)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then((endpoint) => {
            if (pathName.includes("$context")) {
              return "context (ignored)";
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
        escapePathForImport(nodePath.join(this.basePath, directory, file.name))
      );

      if (file.name.includes("$context")) {
        this.addContext(directory, endpoint);
      } else {
        this.registry.add(
          `/${nodePath.join(directory, nodePath.parse(file.name).name)}`,
          endpoint
        );
      }
    });

    await Promise.all(imports);
  }

  addContext(directory, endpoint) {
    this.contextRegistry.add(`/${directory}`, endpoint.default);
  }
}
