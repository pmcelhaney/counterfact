import fs, { rm } from "node:fs/promises";
import nodePath from "node:path";

import { createHttpTerminator, type HttpTerminator } from "http-terminator";

import { startRepl as startReplServer } from "./repl/repl.js";
import { createRouteFunction } from "./repl/route-builder.js";
import type { Config } from "./server/config.js";
import { ContextRegistry } from "./server/context-registry.js";
import { createKoaApp } from "./server/create-koa-app.js";
import { Dispatcher, type DispatcherRequest } from "./server/dispatcher.js";
import { koaMiddleware } from "./server/koa-middleware.js";
import { loadOpenApiDocument } from "./server/load-openapi-document.js";
import { ModuleLoader } from "./server/module-loader.js";
import { Registry } from "./server/registry.js";
import { ScenarioRegistry } from "./server/scenario-registry.js";
import { Transpiler } from "./server/transpiler.js";
import { CodeGenerator } from "./typescript-generator/code-generator.js";
import { writeScenarioContextType } from "./typescript-generator/generate.js";
import { runtimeCanExecuteErasableTs } from "./util/runtime-can-execute-erasable-ts.js";

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
  config: Config,
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
  config: Config,
  ModuleLoaderClass = ModuleLoader,
) {
  // TODO: For some reason the Vitest Custom Commands needed by Vitest Browser mode fail on fs.readFile when they are called from the nested loadOpenApiDocument function.
  // If we "pre-read" the file here it works. This is a workaround to avoid the issue.
  await fs.readFile(config.openApiPath);
  const openApiDocument = await loadOpenApiDocument(config.openApiPath);
  const modulesPath = config.basePath;
  const compiledPathsDirectory = nodePath
    .join(modulesPath, ".cache")
    .replaceAll("\\", "/");

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
 * One per-spec bundle of services.  Each spec gets its own Registry,
 * Dispatcher, CodeGenerator, Transpiler, and ModuleLoader so that the classes
 * themselves never need to know about multiple APIs.
 */
interface SpecBundle {
  base: string;
  registry: Registry;
  dispatcher: Dispatcher;
  codeGenerator: CodeGenerator;
  transpiler: Transpiler;
  moduleLoader: ModuleLoader;
  openApiDocument: Awaited<ReturnType<typeof loadOpenApiDocument>> | undefined;
  compiledPathsDirectory: string;
}

/**
 * Creates all per-spec services for one entry in the resolved `specs` list.
 *
 * When `specSource` is `"_"` the document is skipped and `openApiDocument`
 * will be `undefined`; callers must guard code-generation calls accordingly.
 *
 * Pass `scenariosPath` and `scenarioRegistry` only for the primary spec so
 * that the startup-scenario and REPL have access to the right modules.
 */
async function createSpecBundle(
  config: Config,
  specSource: string,
  specBase: string,
  contextRegistry: ContextRegistry,
  nativeTs: boolean,
  scenariosPath?: string,
  scenarioRegistry?: ScenarioRegistry,
): Promise<SpecBundle> {
  const specDest = nodePath
    .join(config.basePath, specBase)
    .replaceAll("\\", "/");

  const compiledPathsDirectory = nodePath
    .join(specDest, nativeTs ? "routes" : ".cache")
    .replaceAll("\\", "/");

  if (!nativeTs) {
    await rm(compiledPathsDirectory, { force: true, recursive: true });
  }

  const registry = new Registry();

  const openApiDocument =
    specSource === "_" ? undefined : await loadOpenApiDocument(specSource);

  const dispatcher = new Dispatcher(
    registry,
    contextRegistry,
    openApiDocument,
    config,
  );

  const codeGenerator = new CodeGenerator(
    specSource,
    specDest,
    config.generate,
  );

  const transpiler = new Transpiler(
    nodePath.join(specDest, "routes").replaceAll("\\", "/"),
    compiledPathsDirectory,
    "commonjs",
  );

  const moduleLoader = new ModuleLoader(
    compiledPathsDirectory,
    registry,
    contextRegistry,
    scenariosPath,
    scenarioRegistry,
  );

  return {
    base: specBase,
    registry,
    dispatcher,
    codeGenerator,
    transpiler,
    moduleLoader,
    openApiDocument,
    compiledPathsDirectory,
  };
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
  const modulesPath = config.basePath;

  const nativeTs = await runtimeCanExecuteErasableTs();

  const contextRegistry = new ContextRegistry();
  const scenarioRegistry = new ScenarioRegistry();

  contextRegistry.addEventListener("context-changed", () => {
    void writeScenarioContextType(modulesPath);
  });

  // Normalise: a plain single-spec config is treated as one-element specs list
  // so there is no divergence between single-spec and multi-spec code paths.
  const specs =
    config.specs && config.specs.length > 0
      ? config.specs
      : [{ source: config.openApiPath, base: "" }];

  // Scenarios are wired only to the primary (first) spec.
  const primaryScenariosPath = nodePath
    .join(modulesPath, "scenarios")
    .replaceAll("\\", "/");

  const specBundles = await Promise.all(
    specs.map((spec, index) =>
      createSpecBundle(
        config,
        spec.source,
        spec.base,
        contextRegistry,
        nativeTs,
        index === 0 ? primaryScenariosPath : undefined,
        index === 0 ? scenarioRegistry : undefined,
      ),
    ),
  );

  // Guaranteed non-empty: specs always has at least one item after normalisation.
  const primaryBundle = specBundles[0] as SpecBundle;
  const primarySpec = specs[0] as (typeof specs)[number];

  // Build one per-spec middleware. For the normalised single-spec entry
  // (base === "") preserve config.routePrefix so existing behaviour is
  // unchanged. For named specs use "/" + base.
  const specMiddlewares = specBundles.map((bundle) =>
    koaMiddleware(bundle.dispatcher, {
      ...config,
      routePrefix: bundle.base === "" ? config.routePrefix : `/${bundle.base}`,
    }),
  );

  const primaryRegistry = primaryBundle.registry;

  const koaApp = createKoaApp(
    primaryRegistry,
    specMiddlewares,
    {
      ...config,
      openApiPath: primaryBundle.openApiDocument ? primarySpec.source : "_",
    },
    contextRegistry,
  );

  async function start(options: Config) {
    const { generate, startServer, watch, buildCache } = options;

    await Promise.all(
      specBundles.map(async (bundle) => {
        if (bundle.openApiDocument && (generate.routes || generate.types)) {
          await bundle.codeGenerator.generate();
        }

        if (bundle.openApiDocument && (watch.routes || watch.types)) {
          await bundle.codeGenerator.watch();
        }
      }),
    );

    let httpTerminator: HttpTerminator | undefined;

    if (startServer) {
      await Promise.all(
        specBundles.map(async (bundle) => {
          await bundle.openApiDocument?.watch();

          if (!nativeTs) {
            await bundle.transpiler.watch();
          }

          await bundle.moduleLoader.load();
          await bundle.moduleLoader.watch();
        }),
      );

      await runStartupScenario(
        scenarioRegistry,
        contextRegistry,
        config,
        primaryBundle.openApiDocument,
      );

      const server = koaApp.listen({ port: config.port });

      httpTerminator = createHttpTerminator({ server });
    } else if (buildCache) {
      await Promise.all(
        specBundles.map(async (bundle) => {
          await bundle.transpiler.watch();
          await bundle.transpiler.stopWatching();
        }),
      );
    }

    return {
      async stop() {
        await Promise.all(
          specBundles.map(async (bundle) => {
            await bundle.codeGenerator.stopWatching();
            await bundle.transpiler.stopWatching();
            await bundle.moduleLoader.stopWatching();
            await bundle.openApiDocument?.stopWatching();
          }),
        );
        await httpTerminator?.terminate();
      },
    };
  }

  return {
    contextRegistry,
    koaApp,
    koaMiddleware: specMiddlewares,
    registry: primaryRegistry,
    start,
    startRepl: () =>
      startReplServer(
        contextRegistry,
        primaryRegistry,
        config,
        undefined,
        primaryBundle.openApiDocument,
        scenarioRegistry,
      ),
  };
}
