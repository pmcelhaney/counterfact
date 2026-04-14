import fs from "node:fs/promises";

import { createHttpTerminator, type HttpTerminator } from "http-terminator";

import { ApiRunner } from "./api-runner.js";
import { startRepl as startReplServer } from "./repl/repl.js";
import { createRouteFunction } from "./repl/route-builder.js";
import type { Config } from "./server/config.js";
import { ContextRegistry } from "./server/context-registry.js";
import { createKoaApp } from "./server/create-koa-app.js";
import { Dispatcher, type DispatcherRequest } from "./server/dispatcher.js";
import { loadOpenApiDocument } from "./server/load-openapi-document.js";
import { ModuleLoader } from "./server/module-loader.js";
import { Registry } from "./server/registry.js";
import { ScenarioRegistry } from "./server/scenario-registry.js";
import { pathJoin } from "./util/forward-slash-path.js";

export { loadOpenApiDocument } from "./server/load-openapi-document.js";

type Scenario$ = {
  context: Record<string, unknown>;
  loadContext: (path: string) => Record<string, unknown>;
  route: (path: string) => unknown;
  routes: Record<string, unknown>;
};

export async function runStartupScenario(
  scenarioRegistry: ScenarioRegistry,
  contextRegistry: ContextRegistry,
  config: Pick<Config, "port">,
  openApiDocument?: Parameters<typeof createRouteFunction>[2],
): Promise<void> {
  const indexModule = scenarioRegistry.getModule("index");

  if (!indexModule || typeof indexModule["startup"] !== "function") {
    return;
  }

  const scenario$: Scenario$ = {
    context: contextRegistry.find("/") as Record<string, unknown>,
    loadContext: (path: string) =>
      contextRegistry.find(path) as Record<string, unknown>,
    route: createRouteFunction(config.port, "localhost", openApiDocument),
    routes: {},
  };

  await (indexModule["startup"] as (ctx: Scenario$) => Promise<void> | void)(
    scenario$,
  );
}

type MswHandlerMap = {
  [key: string]: (request: MockRequest) => Promise<unknown>;
};
const allowedMethods = [
  "all",
  "head",
  "get",
  "post",
  "put",
  "delete",
  "patch",
  "options",
] as const;

export type MockRequest = DispatcherRequest & { rawPath: string };

const mswHandlers: MswHandlerMap = {};

/**
 * Dispatches a single MSW (Mock Service Worker) intercepted request to the
 * matching Counterfact route handler registered via {@link createMswHandlers}.
 *
 * @param request - The intercepted request, including the HTTP method, path,
 *   headers, query, body, and a `rawPath` that preserves the original URL
 *   before base-path stripping.
 * @returns The response produced by the matching handler, or a 404 object when
 *   no handler has been registered for the given method and path.
 */
export async function handleMswRequest(request: MockRequest) {
  const { method, rawPath } = request;
  const handler = mswHandlers[`${method}:${rawPath}`];
  if (handler) {
    return handler(request);
  }
  console.warn(`No handler found for ${method} ${rawPath}`);
  return { error: `No handler found for ${method} ${rawPath}`, status: 404 };
}

/**
 * Loads an OpenAPI document, registers all routes from it as MSW handlers, and
 * returns the list of registered routes so callers (e.g. Vitest Browser mode)
 * can mount them on their own request-interception layer.
 *
 * @param config - Counterfact configuration; `openApiPath` and `basePath` are
 *   the most important fields for this function.
 * @param ModuleLoaderClass - Injectable module-loader constructor, primarily
 *   used in tests to substitute a test-friendly implementation.
 * @returns An array of `{ method, path }` objects describing every registered
 *   MSW handler.
 */
export async function createMswHandlers(
  config: Pick<
    Config,
    | "openApiPath"
    | "basePath"
    | "validateRequests"
    | "validateResponses"
    | "alwaysFakeOptionals"
  >,
  ModuleLoaderClass = ModuleLoader,
) {
  // TODO: For some reason the Vitest Custom Commands needed by Vitest Browser mode fail on fs.readFile when they are called from the nested loadOpenApiDocument function.
  // If we "pre-read" the file here it works. This is a workaround to avoid the issue.
  await fs.readFile(config.openApiPath);
  const openApiDocument = await loadOpenApiDocument(config.openApiPath);
  const modulesPath = config.basePath;
  const compiledPathsDirectory = pathJoin(modulesPath, ".cache");

  const registry = new Registry();
  const contextRegistry = new ContextRegistry();
  const dispatcher = new Dispatcher(
    registry,
    contextRegistry,
    openApiDocument,
    config,
  );
  const moduleLoader = new ModuleLoaderClass(
    compiledPathsDirectory,
    registry,
    contextRegistry,
  );
  await moduleLoader.load();
  const routes = registry.routes;
  const handlers = routes.flatMap((route) => {
    const { methods, path } = route;

    return Object.keys(methods)
      .filter((method) =>
        allowedMethods.includes(
          method.toLowerCase() as (typeof allowedMethods)[number],
        ),
      )
      .map((method) => {
        const lowerMethod = method.toLowerCase();
        const apiPath = `${openApiDocument.basePath ?? ""}${path.replaceAll("{", ":").replaceAll("}", "")}`;
        const handler = async (request: MockRequest) => {
          return await dispatcher.request(request);
        };
        mswHandlers[`${method}:${apiPath}`] = handler;
        return { method: lowerMethod, path: apiPath };
      });
  });
  return handlers;
}

/**
 * Creates and configures a full Counterfact server instance.
 *
 * Sets up the route registry, context registry, scenario registry, code
 * generator, transpiler, module loader, Koa application, and OpenAPI watcher.
 * The returned object exposes handles for starting the server, stopping it, and
 * launching the interactive REPL.
 *
 * @param config - Runtime configuration (port, paths, feature flags, etc.).
 * @returns An object containing the configured sub-systems and two entry-point
 *   functions:
 *   - `start(options)` — generates/watches code and optionally starts the HTTP
 *     server; returns a `stop()` handle.
 *   - `startRepl()` — launches the interactive Node.js REPL connected to the
 *     live server state.
 */
export async function counterfact(config: Config) {
  const runner = await ApiRunner.create(config);

  const koaApp = createKoaApp({
    config,
    contextRegistry: runner.contextRegistry,
    dispatcher: runner.dispatcher,
    registry: runner.registry,
  });

  async function start(
    options: Pick<Config, "generate" | "startServer" | "watch" | "buildCache">,
  ) {
    const { generate, startServer, watch, buildCache } = options;

    if (config.openApiPath !== "_" && (generate.routes || generate.types)) {
      await runner.codeGenerator.generate();
    }

    if (generate.types) {
      await runner.scenarioFileGenerator.generate();
    }

    if (config.openApiPath !== "_" && (watch.routes || watch.types)) {
      await runner.codeGenerator.watch();
    }

    if (watch.types) {
      await runner.scenarioFileGenerator.watch();
    }

    let httpTerminator: HttpTerminator | undefined;

    if (startServer) {
      await runner.openApiDocument?.watch();

      if (!runner.nativeTs) {
        await runner.transpiler.watch();
      }
      await runner.load();
      await runner.moduleLoader.watch();

      await runStartupScenario(
        runner.scenarioRegistry,
        runner.contextRegistry,
        config,
        runner.openApiDocument,
      );

      const server = koaApp.listen({
        port: config.port,
      });

      httpTerminator = createHttpTerminator({
        server,
      });
    } else if (buildCache) {
      // If we are not starting the server, we still want to transpile and load modules
      await runner.transpiler.watch();
      await runner.transpiler.stopWatching();
    }

    return {
      async stop() {
        await runner.stopWatching();
        await httpTerminator?.terminate();
      },
    };
  }

  return {
    contextRegistry: runner.contextRegistry,
    koaApp,
    registry: runner.registry,
    start,
    startRepl: () =>
      startReplServer(
        runner.contextRegistry,
        runner.registry,
        config,
        undefined, // use the default print function (stdout)
        runner.openApiDocument,
        runner.scenarioRegistry,
      ),
  };
}
