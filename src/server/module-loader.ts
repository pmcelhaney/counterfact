import fs from "node:fs/promises";
import { existsSync, type Dirent } from "node:fs";
import nodePath from "node:path";
import { once } from "node:events";

import chokidar from "chokidar";

import { ContextRegistry } from "./context-registry.ts";
import type { Registry } from "./registry.ts";

interface Module {
  default: unknown;
}

export class ModuleLoader extends EventTarget {
  private readonly basePath: string;

  private readonly registry: Registry;

  private watcher: chokidar.FSWatcher | undefined;

  private readonly contextRegistry: ContextRegistry;

  public constructor(
    basePath: string,
    registry: Registry,
    contextRegistry = new ContextRegistry()
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
          `/${nodePath.join(parts.dir, parts.name)}`
        );

        if (eventName === "unlink") {
          this.registry.remove(url);
          this.dispatchEvent(new Event("remove"));
        }

        // eslint-disable-next-line import/no-dynamic-require, no-unsanitized/method
        import(`${pathName}?cacheBust=${Date.now()}`)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then((endpoint: Module) => {
            this.dispatchEvent(new Event(eventName));

            if (pathName.includes("$.context")) {
              this.contextRegistry.update(parts.dir, endpoint.default);

              return "context";
            }

            this.registry.add(url, endpoint);

            return "path";
          })
          // eslint-disable-next-line promise/prefer-await-to-then
          .catch((error: unknown) => {
            process.stdout.write(
              `\nError loading ${pathName}:\n${String(error)}\n`
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

      if (!["js", "mjs", "ts", "mts"].includes(extension ?? "")) {
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
    file: Dirent
  ) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, no-unsanitized/method, @typescript-eslint/consistent-type-assertions
      const endpoint: Module = (await import(fullPath)) as Module;

      if (file.name.includes("$.context")) {
        this.contextRegistry.add(`/${directory}`, endpoint.default);
      } else {
        this.registry.add(
          `/${nodePath.join(directory, nodePath.parse(file.name).name)}`,
          endpoint
        );
      }
    } catch (error: unknown) {
      process.stdout.write(`\nError loading ${fullPath}:\n${String(error)}\n`);
    }
  }
}
