/* eslint-disable n/no-sync */
import { once } from "node:events";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath, { basename, dirname } from "node:path";

import { type FSWatcher, watch } from "chokidar";
import createDebug from "debug";

import { CHOKIDAR_OPTIONS } from "./constants.js";
import { type Context, ContextRegistry } from "./context-registry.js";
import { determineModuleKind } from "./determine-module-kind.js";
import { ModuleDependencyGraph } from "./module-dependency-graph.js";
import type { InterceptorCallback, Module, Registry } from "./registry.js";
import { uncachedImport } from "./uncached-import.js";

const { uncachedRequire } = await import("./uncached-require.cjs");

const debug = createDebug("counterfact:server:module-loader");

interface ContextModule {
  Context?: Context;
  intercept?: InterceptorCallback;
}

function isContextModule(
  module: ContextModule | Module,
): module is ContextModule {
  return "Context" in module && typeof module.Context === "function";
}

function isInterceptModule(
  module: ContextModule | Module,
): module is ContextModule & { intercept: InterceptorCallback } {
  return "intercept" in module && typeof module.intercept === "function";
}

export class ModuleLoader extends EventTarget {
  private readonly basePath: string;

  public readonly registry: Registry;

  private watcher: FSWatcher | undefined;

  private readonly contextRegistry: ContextRegistry;

  private readonly dependencyGraph = new ModuleDependencyGraph();

  private readonly uncachedImport: (moduleName: string) => Promise<unknown> =
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

  public async watch(): Promise<void> {
    this.watcher = watch(this.basePath, CHOKIDAR_OPTIONS).on(
      "all",

      (eventName: string, pathNameOriginal: string) => {
        const JS_EXTENSIONS = ["js", "mjs", "cjs", "ts", "mts", "cts"];

        if (
          !JS_EXTENSIONS.some((extension) =>
            pathNameOriginal.endsWith(`.${extension}`),
          )
        )
          return;

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

        const dependencies = this.dependencyGraph.dependentsOf(pathName);

        void this.loadEndpoint(pathName);

        for (const dependency of dependencies) {
          void this.loadEndpoint(dependency);
        }
      },
    );
    await once(this.watcher, "ready");
  }

  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }

  public async load(directory = ""): Promise<void> {
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

      if (!["cjs", "cts", "js", "mjs", "mts", "ts"].includes(extension ?? "")) {
        return;
      }

      const fullPath = nodePath
        .join(this.basePath, directory, file.name)
        .replaceAll("\\", "/");

      await this.loadEndpoint(fullPath);
    });

    await Promise.all(imports);
  }

  private async loadEndpoint(pathName: string) {
    debug("importing module: %s", pathName);

    const directory = dirname(pathName.slice(this.basePath.length)).replaceAll(
      "\\",
      "/",
    );

    const url = `/${nodePath.join(
      directory,
      nodePath.parse(basename(pathName)).name,
    )}`
      .replaceAll("\\", "/")
      .replaceAll(/\/+/gu, "/");

    this.dependencyGraph.load(pathName);

    try {
      const doImport =
        (await determineModuleKind(pathName)) === "commonjs"
          ? uncachedRequire
          : uncachedImport;

      const endpoint = (await doImport(pathName)) as ContextModule | Module;

      this.dispatchEvent(new Event("add"));

      if (
        basename(pathName).startsWith("_.context.") &&
        isContextModule(endpoint)
      ) {
        const loadContext = (path: string) => this.contextRegistry.find(path);

        this.contextRegistry.update(
          directory,

          // @ts-expect-error TS says Context has no constructable signatures but that's not true?

          new endpoint.Context({
            loadContext,
          }),
        );
        return;
      }

      if (
        basename(pathName).startsWith("_.middleware.") &&
        isInterceptModule(endpoint)
      ) {
        this.registry.addInterceptor(url, endpoint.intercept);
      }

      if (url === "/index") this.registry.add("/", endpoint as Module);
      this.registry.add(url, endpoint as Module);
    } catch (error: unknown) {
      if (
        String(error) ===
        "SyntaxError: Identifier 'Context' has already been declared"
      ) {
        // Not sure why Node throws this error. It doesn't seem to matter.
        return;
      }

      process.stdout.write(`\nError loading ${pathName}:\n${String(error)}\n`);

      throw error;
    }
  }
}
