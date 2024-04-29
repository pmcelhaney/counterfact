import { once } from "node:events";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath, { basename } from "node:path";

import { type FSWatcher, watch } from "chokidar";
import createDebug from "debug";

import { CHOKIDAR_OPTIONS } from "./constants.js";
import { type Context, ContextRegistry } from "./context-registry.js";
import { determineModuleKind } from "./determine-module-kind.js";
import type { Module, Registry } from "./registry.js";
import { uncachedImport } from "./uncached-import.js";

const { uncachedRequire } = await import("./uncached-require.cjs");

const debug = createDebug("counterfact:typescript-generator:module-loader");

interface ContextModule {
  Context: Context;
}

function isContextModule(
  module: ContextModule | Module,
): module is ContextModule {
  return "Context" in module && typeof module.Context === "function";
}

function reportLoadError(error: unknown, fileUrl: string) {
  if (
    String(error) ===
    "SyntaxError: Identifier 'Context' has already been declared"
  ) {
    // Not sure why Node throws this error. It doesn't seem to matter.
    return;
  }

  process.stdout.write(`\nError loading ${fileUrl}:\n~~${String(error)}~~\n`);
}

export class ModuleLoader extends EventTarget {
  private readonly basePath: string;

  public readonly registry: Registry;

  private watcher: FSWatcher | undefined;

  private readonly contextRegistry: ContextRegistry;

  private uncachedImport: (moduleName: string) => Promise<unknown> =
    // eslint-disable-next-line @typescript-eslint/require-await
    async function (moduleName: string) {
      throw new Error(`uncachedImport not set up; importing ${moduleName}`);
    };

  public constructor(
    basePath: string,
    registry: Registry,
    contextRegistry = new ContextRegistry(),
  ) {
    super();
    this.basePath = basePath.replaceAll("\\", "/");
    this.registry = registry;
    this.contextRegistry = contextRegistry;
  }

  private async loadEndpointFromWatch(
    pathName: string,
    directory: string,
    url: string,
  ) {
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const endpoint = (await this.uncachedImport(pathName)) as
        | ContextModule
        | Module;

      this.dispatchEvent(new Event("add"));

      if (basename(pathName).startsWith("_.context")) {
        if (isContextModule(endpoint)) {
          this.contextRegistry.update(
            directory,

            // @ts-expect-error TS says Context has no constructable signatures but that's not true?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            new endpoint.Context(),
          );
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        this.registry.add(url, endpoint as Module);
      }
    } catch (error) {
      reportLoadError(error, pathName);
    }
  }

  public async watch(): Promise<void> {
    this.watcher = watch(
      `${this.basePath}/**/*.{js,mjs,ts,mts}`,
      CHOKIDAR_OPTIONS,
    ).on(
      "all",
      // eslint-disable-next-line max-statements
      (eventName: string, pathNameOriginal: string) => {
        const pathName = pathNameOriginal.replaceAll("\\", "/");

        if (pathName.includes("$.context") && eventName === "add") {
          process.stdout.write(
            `\n\n!!! The file at ${pathName} needs a minor update.\n    See https://github.com/pmcelhaney/counterfact/blob/main/docs/context-change.md\n\n\n`,
          );
          return;
        }

        if (!["add", "change", "unlink"].includes(eventName)) {
          return;
        }

        const parts = nodePath.parse(pathName.replace(this.basePath, ""));
        const url = `/${parts.dir}/${parts.name}`
          .replaceAll("\\", "/")
          .replaceAll(/\/+/gu, "/");

        if (eventName === "unlink") {
          this.registry.remove(url);
          this.dispatchEvent(new Event("remove"));
        }

        debug("importing module: %s", pathName);

        void this.loadEndpointFromWatch(pathName, parts.dir, url);
      },
    );
    await once(this.watcher, "ready");
  }

  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }

  public async load(directory = ""): Promise<void> {
    const moduleKind = await determineModuleKind(this.basePath);

    this.uncachedImport =
      moduleKind === "module" ? uncachedImport : uncachedRequire;

    if (
      !existsSync(nodePath.join(this.basePath, directory).replaceAll("\\", "/"))
    ) {
      throw new Error(`Directory does not exist ${this.basePath}`);
    }

    const files = await fs.readdir(
      nodePath.join(this.basePath, directory).replaceAll("\\", "/"),
      {
        withFileTypes: true,
      },
    );

    const imports = files.flatMap(async (file): Promise<void> => {
      const extension = file.name.split(".").at(-1);

      if (file.isDirectory()) {
        await this.load(
          nodePath.join(directory, file.name).replaceAll("\\", "/"),
        );

        return;
      }

      if (!["js", "mjs", "mts", "ts"].includes(extension ?? "")) {
        return;
      }

      const fullPath = nodePath
        .join(this.basePath, directory, file.name)
        .replaceAll("\\", "/");

      const url = `/${nodePath.join(
        directory,
        nodePath.parse(basename(fullPath)).name,
      )}`
        .replaceAll("\\", "/")
        .replaceAll(/\/+/gu, "/");

      await this.loadEndpoint(fullPath, directory, url);
    });

    await Promise.all(imports);
  }

  private async loadEndpoint(pathName: string, directory: string, url: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const endpoint = (await this.uncachedImport(pathName)) as
        | ContextModule
        | Module;

      this.dispatchEvent(new Event("add"));

      if (basename(pathName).startsWith("_.context")) {
        if (isContextModule(endpoint)) {
          this.contextRegistry.add(
            `/${directory.replaceAll("\\", "/")}`,

            // @ts-expect-error TS says Context has no constructable signatures but that's not true?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            new endpoint.Context(),
          );
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        this.registry.add(url, endpoint as Module);
      }
    } catch (error: unknown) {
      if (
        String(error) ===
        "SyntaxError: Identifier 'Context' has already been declared"
      ) {
        // Not sure why Node throws this error. It doesn't seem to matter.
        return;
      }

      process.stdout.write(`\nError loading ${pathName}:\n${String(error)}\n`);
    }
  }
}
