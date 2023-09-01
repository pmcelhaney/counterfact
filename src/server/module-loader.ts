import { once } from "node:events";
import { type Dirent, existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath from "node:path";

import chokidar from "chokidar";

import { type Context, ContextRegistry } from "./context-registry.js";
import type { Module, Registry } from "./registry.js";

interface ContextModule {
  default?: Context;
}

export class ModuleLoader extends EventTarget {
  private readonly basePath: string;

  public readonly registry: Registry;

  private watcher: chokidar.FSWatcher | undefined;

  private readonly contextRegistry: ContextRegistry;

  public constructor(
    basePath: string,
    registry: Registry,
    contextRegistry = new ContextRegistry(),
  ) {
    super();
    this.basePath = basePath;
    this.registry = registry;
    this.contextRegistry = contextRegistry;
  }

  public async watch(): Promise<void> {
    this.watcher = chokidar
      .watch(`${this.basePath}/**/*.{js,mjs,ts,mts}`)
      .on("all", (eventName: string, pathName: string) => {
        if (!["add", "change", "unlink"].includes(eventName)) {
          return;
        }

        const parts = nodePath.parse(pathName.replace(this.basePath, ""));
        const url = nodePath.normalize(
          `/${nodePath.join(parts.dir, parts.name)}`,
        );

        if (eventName === "unlink") {
          this.registry.remove(url);
          this.dispatchEvent(new Event("remove"));
        }

        // eslint-disable-next-line import/no-dynamic-require, no-unsanitized/method
        import(`${pathName}?cacheBust=${Date.now()}`)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then((endpoint: ContextModule | Module) => {
            this.dispatchEvent(new Event(eventName));

            if (pathName.includes("$.context")) {
              this.contextRegistry.update(
                parts.dir,
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                (endpoint as ContextModule).default,
              );

              return "context";
            }

            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            this.registry.add(url, endpoint as Module);

            return "path";
          })
          // eslint-disable-next-line promise/prefer-await-to-then
          .catch((error: unknown) => {
            process.stdout.write(
              `\nError loading ${pathName}:\n${String(error)}\n`,
            );
          });
      });
    await once(this.watcher, "ready");
  }

  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }

  public async load(directory = ""): Promise<void> {
    if (!existsSync(nodePath.join(this.basePath, directory))) {
      throw new Error(`Directory does not exist ${this.basePath}`);
    }

    const files = await fs.readdir(nodePath.join(this.basePath, directory), {
      withFileTypes: true,
    });

    const imports = files.flatMap(async (file): Promise<void> => {
      const extension = file.name.split(".").at(-1);

      if (file.isDirectory()) {
        await this.load(nodePath.join(directory, file.name));

        return;
      }

      if (!["js", "mjs", "mts", "ts"].includes(extension ?? "")) {
        return;
      }

      const fullPath = nodePath.join(this.basePath, directory, file.name);
      await this.loadEndpoint(fullPath, directory, file);
    });

    await Promise.all(imports);
  }

  private async loadEndpoint(
    fullPath: string,
    directory: string,
    file: Dirent,
  ) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, no-unsanitized/method, @typescript-eslint/consistent-type-assertions
      const endpoint: ContextModule | Module = (await import(fullPath)) as
        | ContextModule
        | Module;

      if (file.name.includes("$.context")) {
        this.contextRegistry.add(
          `/${directory}`,

          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          (endpoint as ContextModule).default,
        );
      } else {
        this.registry.add(
          `/${nodePath.join(directory, nodePath.parse(file.name).name)}`,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          endpoint as Module,
        );
      }
    } catch (error: unknown) {
      process.stdout.write(`\nError loading ${fullPath}:\n${String(error)}\n`);
    }
  }
}
