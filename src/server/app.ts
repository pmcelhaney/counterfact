import { rm } from "node:fs/promises";
import nodePath from "node:path";

import { createHttpTerminator, type HttpTerminator } from "http-terminator";
import yaml from "js-yaml";
import $RefParser from "json-schema-ref-parser";

import { CodeGenerator } from "../typescript-generator/code-generator.js";
import { readFile } from "../util/read-file.js";
import type { Config } from "./config.js";
import { ContextRegistry } from "./context-registry.js";
import { createKoaApp } from "./create-koa-app.js";
import { Dispatcher, type OpenApiDocument } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { Registry } from "./registry.js";
import { startRepl } from "./repl.js";
import { Transpiler } from "./transpiler.js";

async function loadOpenApiDocument(source: string) {
  try {
    const text = await readFile(source);
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const openApiDocument = (await yaml.load(text)) as $RefParser.JSONSchema;

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return (await $RefParser.dereference(openApiDocument)) as OpenApiDocument;
  } catch {
    return undefined;
  }
}

// eslint-disable-next-line max-statements
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
  );

  const transpiler = new Transpiler(
    nodePath.join(modulesPath, "paths").replaceAll("\\", "/"),
    compiledPathsDirectory,
    "commonjs",
  );

  const moduleLoader = new ModuleLoader(
    compiledPathsDirectory,
    registry,
    contextRegistry,
  );

  const middleware = koaMiddleware(dispatcher, config);

  const koaApp = createKoaApp(registry, middleware, config);

  // eslint-disable-next-line max-statements
  async function start(options: Config) {
    const {
      generate,
      startRepl: shouldStartRepl,
      startServer,
      watch,
    } = options;

    if (generate.routes || generate.types) {
      await codeGenerator.generate();
    }
    if (watch.routes || watch.types) {
      await codeGenerator.watch();
    }

    // eslint-disable-next-line @typescript-eslint/init-declarations
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
    }

    const replServer = shouldStartRepl && startRepl(contextRegistry, config);

    return {
      replServer,

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
  };
}
