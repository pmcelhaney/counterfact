import nodePath from "node:path";

import yaml from "js-yaml";
import $RefParser from "json-schema-ref-parser";

import { readFile } from "../util/read-file.js";
import { ContextRegistry } from "./context-registry.js";
import { Dispatcher, type OpenApiDocument } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { Registry } from "./registry.js";
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
export async function counterfact(
  basePath: string,
  openApiPath = nodePath
    .join(basePath, "../openapi.yaml")
    .replaceAll("\\", "/"),
  options = {},
) {
  const openApiDocument = await loadOpenApiDocument(openApiPath);

  const registry = new Registry();

  const modulesPath = basePath;

  const contextRegistry = new ContextRegistry();

  const dispatcher = new Dispatcher(registry, contextRegistry, openApiDocument);

  const compiledPathsDirectory = nodePath
    .join(modulesPath, ".cache")
    .replaceAll("\\", "/");

  const transpiler = new Transpiler(
    nodePath.join(modulesPath, "paths").replaceAll("\\", "/"),
    compiledPathsDirectory,
  );

  const moduleLoader = new ModuleLoader(
    compiledPathsDirectory,
    registry,
    contextRegistry,
  );

  async function start() {
    await transpiler.watch();
    await moduleLoader.load();
    await moduleLoader.watch();
  }

  async function stop() {
    await transpiler.stopWatching();
    await moduleLoader.stopWatching();
  }

  return {
    contextRegistry,
    // eslint-disable-next-line total-functions/no-unsafe-readonly-mutable-assignment
    koaMiddleware: koaMiddleware(dispatcher, options),
    registry,
    start,
    stop,
  };
}
