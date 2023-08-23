import nodePath from "node:path";

import $RefParser from "json-schema-ref-parser";
import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { ContextRegistry } from "./context-registry.js";
import { Transpiler } from "./transpiler.js";

async function loadOpenApiDocument(source) {
  try {
    return $RefParser.dereference(await yaml.load(await readFile(source)));
  } catch {
    return undefined;
  }
}

// eslint-disable-next-line max-statements
export async function counterfact(
  basePath,
  openApiPath = nodePath
    .join(basePath, "../openapi.yaml")
    .replaceAll("\\", "/"),
  options = {}
) {
  const openApiDocument = await loadOpenApiDocument(openApiPath);

  const registry = new Registry();

  const modulesPath = basePath;

  const contextRegistry = new ContextRegistry();

  const dispatcher = new Dispatcher(registry, contextRegistry, openApiDocument);

  const compiledPathsDirectory = nodePath
    .join(modulesPath, "paths-js")
    .replaceAll("\\", "/");

  const transpiler = new Transpiler(
    nodePath.join(modulesPath, "paths").replaceAll("\\", "/"),
    compiledPathsDirectory
  );

  await transpiler.watch();

  const moduleLoader = new ModuleLoader(
    compiledPathsDirectory,
    registry,
    contextRegistry
  );

  await moduleLoader.load();

  await moduleLoader.watch();

  return {
    koaMiddleware: koaMiddleware(dispatcher, options),
    registry,
    moduleLoader,
    contextRegistry,
  };
}
