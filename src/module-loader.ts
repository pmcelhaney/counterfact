/* eslint-disable node/no-unsupported-features/es-syntax */
/* eslint-disable import/no-dynamic-require */
import fs from "node:fs/promises";
import path from "node:path";
import EventEmitter, { once } from "node:events";

import chokidar from "chokidar";

import type { Registry } from "./registry";
import type { EndpointModule } from "./endpoint-module";

export class ModuleLoader extends EventEmitter {
  private readonly basePath: string;

  private readonly registry: Registry;

  private watcher: chokidar.FSWatcher | undefined;

  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  public constructor(basePath: string, registry: Registry) {
    super();
    this.basePath = basePath;
    this.registry = registry;
  }

  public async watch() {
    if (this.watcher) {
      throw new Error("already watching");
    }

    this.watcher = chokidar
      .watch(`${this.basePath}/**/*`)
      .on("all", (event, pathName) => {
        if (event !== "add" && event !== "change") {
          return;
        }

        import(pathName)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then((endpoint) => {
            const parts = path.parse(pathName.replace(this.basePath, ""));

            this.registry.add(
              `/${path.join(parts.dir, parts.name)}`,
              endpoint as Readonly<EndpointModule>
            );

            this.emit(event, pathName);
            return "ok";
          })
          // eslint-disable-next-line promise/prefer-await-to-then
          .catch((error: unknown) => {
            throw new Error(String(error));
          });
      });

    await once(this.watcher, "ready");
  }

  public async stopWatching() {
    await this.watcher?.close();
  }

  public async load(directory = ""): Promise<void> {
    const files = await fs.readdir(path.join(this.basePath, directory), {
      withFileTypes: true,
    });

    const imports = files.flatMap(async (file) => {
      if (file.isDirectory()) {
        await this.load(path.join(directory, file.name));
        return;
      }

      const endpoint = (await import(
        path.join(this.basePath, directory, file.name)
      )) as EndpointModule;

      this.registry.add(
        `/${path.join(directory, path.parse(file.name).name)}`,
        endpoint
      );
    });
    await Promise.all(imports);
  }
}
