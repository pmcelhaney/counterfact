import nodePath from "node:path";

import { createHttpTerminator } from "http-terminator";
import yaml from "js-yaml";
import $RefParser from "json-schema-ref-parser";

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
  const openApiDocument = await loadOpenApiDocument(config.openApiPath);

  const modulesPath = config.basePath;

  const compiledPathsDirectory = nodePath
    .join(modulesPath, ".cache")
    .replaceAll("\\", "/");

  const registry = new Registry();

  const contextRegistry = new ContextRegistry();

  const dispatcher = new Dispatcher(registry, contextRegistry, openApiDocument);

  const transpiler = new Transpiler(
    nodePath.join(modulesPath, "paths").replaceAll("\\", "/"),
    compiledPathsDirectory,
  );

  const moduleLoader = new ModuleLoader(
    compiledPathsDirectory,
    registry,
    contextRegistry,
  );

  const middleware = koaMiddleware(dispatcher, config);

  const koaApp = createKoaApp(registry, middleware, config);

  async function start(options: { http?: boolean } = {}) {
    const http = options.http ?? true;

    await transpiler.watch();
    await moduleLoader.load();
    await moduleLoader.watch();

    const server = koaApp.listen({
      port: config.port,
    });

    const httpTerminator = http
      ? createHttpTerminator({
          server,
        })
      : {
          terminate() {
            return true;
          },
        };

    const replServer = startRepl(contextRegistry, config);

    return {
      replServer,

      async stop() {
        await transpiler.stopWatching();
        await moduleLoader.stopWatching();
        await httpTerminator.terminate();
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
