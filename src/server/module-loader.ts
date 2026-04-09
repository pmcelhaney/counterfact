import { once } from "node:events";
import fs from "node:fs/promises";
import nodePath, { basename, dirname } from "node:path";

import { type FSWatcher, watch } from "chokidar";
import createDebug from "debug";

import { CHOKIDAR_OPTIONS } from "./constants.js";
import { ContextRegistry } from "./context-registry.js";
import { determineModuleKind } from "./determine-module-kind.js";
import { FileDiscovery } from "./file-discovery.js";
import {
  type ContextModule,
  isContextModule,
  isMiddlewareModule,
} from "./middleware-detector.js";
import { ModuleDependencyGraph } from "./module-dependency-graph.js";
import type { Module, Registry } from "./registry.js";
import { ScenarioRegistry } from "./scenario-registry.js";
import { uncachedImport } from "./uncached-import.js";
import { unescapePathForWindows } from "../util/windows-escape.js";

const { uncachedRequire } = await import("./uncached-require.cjs");

const debug = createDebug("counterfact:server:module-loader");

export class ModuleLoader extends EventTarget {
  private readonly basePath: string;

  public readonly registry: Registry;

  private watcher: FSWatcher | undefined;

  private scenariosWatcher: FSWatcher | undefined;

  private readonly contextRegistry: ContextRegistry;

  private readonly scenariosPath: string | undefined;

  private readonly scenarioRegistry: ScenarioRegistry | undefined;

  private readonly dependencyGraph = new ModuleDependencyGraph();

  private readonly fileDiscovery: FileDiscovery;

  private readonly uncachedImport: (moduleName: string) => Promise<unknown> =
    async function (moduleName: string) {
      throw new Error(`uncachedImport not set up; importing ${moduleName}`);
    };

  public constructor(
    basePath: string,
    registry: Registry,
    contextRegistry = new ContextRegistry(),
    scenariosPath?: string,
    scenarioRegistry?: ScenarioRegistry,
  ) {
    super();
    this.basePath = basePath.replaceAll("\\", "/");
    this.registry = registry;
    this.contextRegistry = contextRegistry;
    this.scenariosPath = scenariosPath?.replaceAll("\\", "/");
    this.scenarioRegistry = scenarioRegistry;
    this.fileDiscovery = new FileDiscovery(this.basePath);
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
        const url = unescapePathForWindows(
          `/${parts.dir}/${parts.name}`
            .replaceAll("\\", "/")
            .replaceAll(/\/+/gu, "/"),
        );

        if (eventName === "unlink") {
          this.registry.remove(url);
          this.dispatchEvent(new Event("remove"));
          return;
        }

        const dependencies = this.dependencyGraph.dependentsOf(pathName);

        void this.loadEndpoint(pathName);

        for (const dependency of dependencies) {
          void this.loadEndpoint(dependency);
        }
      },
    );
    await once(this.watcher, "ready");

    if (this.scenariosPath && this.scenarioRegistry) {
      const JS_EXTENSIONS = ["js", "mjs", "cjs", "ts", "mts", "cts"];
      const scenariosPath = this.scenariosPath;

      this.scenariosWatcher = watch(scenariosPath, CHOKIDAR_OPTIONS).on(
        "all",
        (eventName: string, pathNameOriginal: string) => {
          if (
            !JS_EXTENSIONS.some((ext) => pathNameOriginal.endsWith(`.${ext}`))
          )
            return;

          if (!["add", "change", "unlink"].includes(eventName)) return;

          const pathName = pathNameOriginal.replaceAll("\\", "/");

          if (eventName === "unlink") {
            const fileKey = this.scenarioFileKey(pathName);
            this.scenarioRegistry?.remove(fileKey);
            return;
          }

          void this.loadScenarioFile(pathName);
        },
      );
      await once(this.scenariosWatcher, "ready");
    }
  }

  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
    await this.scenariosWatcher?.close();
  }

  public async load(directory = ""): Promise<void> {
    const files = await this.fileDiscovery.findFiles(directory);
    await Promise.all(files.map((file) => this.loadEndpoint(file)));
    await this.loadScenarios();
  }

  private async loadScenarios(): Promise<void> {
    if (!this.scenariosPath || !this.scenarioRegistry) return;

    try {
      const fileDiscovery = new FileDiscovery(this.scenariosPath);
      const files = await fileDiscovery.findFiles();
      await Promise.all(files.map((file) => this.loadScenarioFile(file)));
    } catch {
      // Scenarios directory does not exist yet — that's fine.
    }
  }

  private scenarioFileKey(pathName: string): string {
    const normalizedScenariosPath = (this.scenariosPath ?? "").replaceAll(
      "\\",
      "/",
    );
    const directory = dirname(
      pathName.slice(normalizedScenariosPath.length),
    ).replaceAll("\\", "/");
    const name = nodePath.parse(basename(pathName)).name;
    const url = unescapePathForWindows(
      `/${nodePath.join(directory, name)}`
        .replaceAll("\\", "/")
        .replaceAll(/\/+/gu, "/"),
    );

    return url.slice(1); // strip leading "/"
  }

  private async loadScenarioFile(pathName: string): Promise<void> {
    if (!this.scenariosPath || !this.scenarioRegistry) return;

    const fileKey = this.scenarioFileKey(pathName);

    try {
      const doImport =
        (await determineModuleKind(pathName)) === "commonjs"
          ? uncachedRequire
          : uncachedImport;

      const module = await doImport(pathName);

      if (module) {
        this.scenarioRegistry.add(fileKey, module as Record<string, unknown>);
      }
    } catch (error: unknown) {
      process.stdout.write(
        `\nError loading scenario ${pathName}:\n${String(error)}\n`,
      );
    }
  }

  private async loadEndpoint(pathName: string) {
    debug("importing module: %s", pathName);

    const directory = dirname(pathName.slice(this.basePath.length)).replaceAll(
      "\\",
      "/",
    );

    const url = unescapePathForWindows(
      `/${nodePath.join(directory, nodePath.parse(basename(pathName)).name)}`
        .replaceAll("\\", "/")
        .replaceAll(/\/+/gu, "/"),
    );

    debug(`loading pathName from dependencyGraph: ${pathName}`);

    this.dependencyGraph.load(pathName);

    try {
      const doImport =
        (await determineModuleKind(pathName)) === "commonjs"
          ? uncachedRequire
          : uncachedImport;

      let importError: unknown;

      const endpoint = (await doImport(pathName).catch((error: unknown) => {
        importError = error;
      })) as ContextModule | Module;

      if (importError !== undefined) {
        const isSyntaxError =
          importError instanceof SyntaxError ||
          String(importError).startsWith("SyntaxError:");

        const displayPath = nodePath
          .relative(process.cwd(), unescapePathForWindows(pathName))
          .replaceAll("\\", "/");

        const message = isSyntaxError
          ? `There is a syntax error in the route file: ${displayPath}`
          : `There was an error loading the route file: ${displayPath}`;

        const errorResponse = () => ({
          body: message,
          status: 500,
        });

        this.registry.add(url, {
          DELETE: errorResponse,
          GET: errorResponse,
          HEAD: errorResponse,
          OPTIONS: errorResponse,
          PATCH: errorResponse,
          POST: errorResponse,
          PUT: errorResponse,
          TRACE: errorResponse,
        });

        this.dispatchEvent(new Event("add"));

        return;
      }

      if (!endpoint) {
        return;
      }

      this.dispatchEvent(new Event("add"));

      if (
        basename(pathName).startsWith("_.context.") &&
        isContextModule(endpoint)
      ) {
        const loadContext = (path: string) => this.contextRegistry.find(path);

        const contextDir = nodePath.dirname(unescapePathForWindows(pathName));
        const readJson = async (relativePath: string): Promise<unknown> => {
          const absolutePath = nodePath.resolve(contextDir, relativePath);
          let content: string;
          try {
            content = await fs.readFile(absolutePath, "utf8");
          } catch {
            throw new Error(
              `readJson: could not read file at "${absolutePath}" (resolved from "${relativePath}" relative to "${contextDir}")`,
            );
          }
          try {
            return JSON.parse(content) as unknown;
          } catch {
            throw new Error(
              `readJson: file at "${absolutePath}" does not contain valid JSON`,
            );
          }
        };

        this.contextRegistry.update(
          directory,

          // @ts-expect-error TS says Context has no constructable signatures but that's not true?

          new endpoint.Context({
            loadContext,
            readJson,
          }),
        );
        return;
      }

      if (
        basename(pathName).startsWith("_.middleware.") &&
        isMiddlewareModule(endpoint)
      ) {
        this.registry.addMiddleware(
          url.slice(0, url.lastIndexOf("/")) || "/",
          endpoint.middleware,
        );
      }

      if (url === "/index") this.registry.add("/", endpoint as Module);

      debug(`adding "${url}" to registry`);
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
