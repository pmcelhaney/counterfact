import fs, { rm } from "node:fs/promises";
import nodePath from "node:path";

import { dereference } from "@apidevtools/json-schema-ref-parser";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";
import yaml from "js-yaml";

import { startRepl } from "./repl/repl.js";
import type { Config } from "./server/config.js";
import { ContextRegistry } from "./server/context-registry.js";
import { createKoaApp, type SpecEntry } from "./server/create-koa-app.js";
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
import { readFile } from "./util/read-file.js";

type MswHandlerMap = {
  [key: string]: (request: any) => Promise<any>;
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
    const text = await readFile(source);

    const openApiDocument = await yaml.load(text);

    return (await dereference(openApiDocument)) as OpenApiDocument;
  } catch {
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
  const _ = await fs.readFile(config.openApiPath);
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

interface SpecSetupResult {
  codeGenerator: CodeGenerator;
  contextRegistry: ContextRegistry;
  entry: SpecEntry;
  moduleLoader: ModuleLoader;
  transpiler: Transpiler;
}

async function setupSpec(config: Config): Promise<SpecSetupResult> {
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

  const entry: SpecEntry = {
    config,
    contextRegistry,
    koaMiddleware: middleware,
    registry,
  };

  return { codeGenerator, contextRegistry, entry, moduleLoader, transpiler };
}

export async function counterfact(configs: Config[]) {
  if (configs.length === 0) {
    throw new Error("At least one config is required");
  }

  const specs = await Promise.all(configs.map(setupSpec));

  const entries = specs.map((s) => s.entry);
  const koaApp = createKoaApp(entries);

  const primaryConfig = configs[0]!;
  const primarySpec = specs[0]!;

  async function start(options: Config) {
    const {
      generate,
      startRepl: shouldStartRepl,
      startServer,
      watch,
      buildCache,
    } = options;

    for (const spec of specs) {
      if (generate.routes || generate.types) {
        await spec.codeGenerator.generate();
      }

      if (watch.routes || watch.types) {
        await spec.codeGenerator.watch();
      }
    }

    let httpTerminator: HttpTerminator | undefined;

    if (startServer) {
      for (const spec of specs) {
        await spec.transpiler.watch();
        await spec.moduleLoader.load();
        await spec.moduleLoader.watch();
      }

      const server = koaApp.listen({ port: primaryConfig.port });

      httpTerminator = createHttpTerminator({ server });
    } else if (buildCache) {
      for (const spec of specs) {
        await spec.transpiler.watch();
        await spec.transpiler.stopWatching();
      }
    }

    const replServer =
      shouldStartRepl && startRepl(primarySpec.contextRegistry, primaryConfig);

    return {
      replServer,

      async stop() {
        for (const spec of specs) {
          await spec.codeGenerator.stopWatching();
          await spec.transpiler.stopWatching();
          await spec.moduleLoader.stopWatching();
        }
        await httpTerminator?.terminate();
      },
    };
  }

  return {
    contextRegistry: primarySpec.contextRegistry,
    koaApp,
    koaMiddleware: entries[0]!.koaMiddleware,
    registry: entries[0]!.registry,
    start,
  };
}
