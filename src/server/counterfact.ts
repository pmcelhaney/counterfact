import nodePath from "node:path";

import $RefParser from "json-schema-ref-parser";
import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import { Registry } from "./registry.js";
import { type OpenApiDocument, Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { ContextRegistry } from "./context-registry.js";

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

export async function counterfact(
  basePath: string,
  openApiPath = nodePath.join(basePath, "../openapi.yaml"),
  options = {}
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
    // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
    koaMiddleware: koaMiddleware(dispatcher, options),
    registry,
    moduleLoader,
    contextRegistry,
  };
}
