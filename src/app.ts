import fs, { rm } from "node:fs/promises";
import nodePath from "node:path";

import { dereference } from "@apidevtools/json-schema-ref-parser";
import createDebug from "debug";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";

import { startRepl as startReplServer } from "./repl/repl.js";
import type { Config } from "./server/config.js";
import { ContextRegistry } from "./server/context-registry.js";
import { createKoaApp } from "./server/create-koa-app.js";
import {
  Dispatcher,
  DispatcherRequest,
  type OpenApiDocument,
} from "./server/dispatcher.js";
import { koaMiddleware } from "./server/koa-middleware.js";
import { ModuleLoader } from "./server/module-loader.js";
import { Registry } from "./server/registry.js";
import { Transpiler } from "./server/transpiler.js";
import { CodeGenerator } from "./typescript-generator/code-generator.js";

const debug = createDebug("counterfact:app");

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

export async function loadOpenApiDocument(source: string) {
  try {
    return (await dereference(source)) as OpenApiDocument;
  } catch (error) {
    debug("could not load OpenAPI document from %s: %o", source, error);
    return undefined;
  }
}

const mswHandlers: MswHandlerMap = {};

export async function handleMswRequest(request: MockRequest) {
  const { method, rawPath } = request;
  const handler = mswHandlers[`${method}:${rawPath}`];
  if (handler) {
    return handler(request);
  }
  console.warn(`No handler found for ${method} ${rawPath}`);
  return { error: `No handler found for ${method} ${rawPath}`, status: 404 };
}

export async function createMswHandlers(
  config: Config,
  ModuleLoaderClass = ModuleLoader,
) {
  // TODO: For some reason the Vitest Custom Commands needed by Vitest Browser mode fail on fs.readFile when they are called from the nested loadOpenApiDocument function.
  // If we "pre-read" the file here it works. This is a workaround to avoid the issue.
  await fs.readFile(config.openApiPath);
  const openApiDocument = await loadOpenApiDocument(config.openApiPath);
  if (openApiDocument === undefined) {
    throw new Error(
      `Could not load OpenAPI document from ${config.openApiPath}`,
    );
  }
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

export async function counterfact(config: Config) {
  const modulesPath = config.basePath;

  const compiledPathsDirectory = nodePath
    .join(modulesPath, ".cache")
    .replaceAll("\\", "/");

  await rm(compiledPathsDirectory, { force: true, recursive: true });

  const registry = new Registry();

  const contextRegistry = new ContextRegistry();

  const codeGenerator = new CodeGenerator(
    config.openApiPath,
    config.basePath,
    config.generate,
  );

  const dispatcher = new Dispatcher(
    registry,
    contextRegistry,
    await loadOpenApiDocument(config.openApiPath),
    config,
  );

  const transpiler = new Transpiler(
    nodePath.join(modulesPath, "routes").replaceAll("\\", "/"),
    compiledPathsDirectory,
    "commonjs",
  );

  const moduleLoader = new ModuleLoader(
    compiledPathsDirectory,
    registry,
    contextRegistry,
  );

  const middleware = koaMiddleware(dispatcher, config);

  const koaApp = createKoaApp(registry, middleware, config, contextRegistry);

  async function start(options: Config) {
    const { generate, startServer, watch, buildCache } = options;

    if (generate.routes || generate.types) {
      await codeGenerator.generate();
    }

    if (watch.routes || watch.types) {
      await codeGenerator.watch();
    }

    let httpTerminator: HttpTerminator | undefined;

    if (startServer) {
      await transpiler.watch();
      await moduleLoader.load();
      await moduleLoader.watch();

      const server = koaApp.listen({
        port: config.port,
      });

      httpTerminator = createHttpTerminator({
        server,
      });
    } else if (buildCache) {
      // If we are not starting the server, we still want to transpile and load modules
      await transpiler.watch();
      await transpiler.stopWatching();
    }

    return {
      async stop() {
        await codeGenerator.stopWatching();
        await transpiler.stopWatching();
        await moduleLoader.stopWatching();
        await httpTerminator?.terminate();
      },
    };
  }

  return {
    contextRegistry,
    koaApp,
    koaMiddleware: middleware,
    registry,
    start,
    startRepl: () => startReplServer(contextRegistry, registry, config),
  };
}
