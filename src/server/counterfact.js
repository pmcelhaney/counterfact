import nodePath from "node:path";

import $RefParser from "json-schema-ref-parser";
import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { ContextRegistry } from "./context-registry.js";

async function loadOpenApiDocument(source) {
  try {
    return $RefParser.dereference(await yaml.load(await readFile(source)));
  } catch {
    return undefined;
  }
}

export async function counterfact(
  basePath,
  openApiPath = nodePath.join(basePath, "../openapi.yaml")
) {
  const openApiDocument = await loadOpenApiDocument(openApiPath);

  const registry = new Registry();

  const modulesPath = basePath;

  const contextRegistry = new ContextRegistry();

  const dispatcher = new Dispatcher(registry, contextRegistry, openApiDocument);
  const moduleLoader = new ModuleLoader(
    nodePath.join(modulesPath, "paths"),
    registry,
    contextRegistry
  );

  await moduleLoader.load();

  await moduleLoader.watch();

  return {
    koaMiddleware: koaMiddleware(dispatcher),
    registry,
    moduleLoader,
    contextRegistry,
  };
}
