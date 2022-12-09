/* eslint-disable import/max-dependencies */
import fs from "node:fs/promises";
import nodePath from "node:path";
import { constants as fsConstants } from "node:fs";

import $RefParser from "json-schema-ref-parser";
import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { Transpiler } from "./transpiler.js";
import { ContextRegistry } from "./context-registry.js";

async function ensureDirectoryExists(directory) {
  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

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
  openApiPath = nodePath.join(basePath, "../openapi.yaml")
) {
  const openApiDocument = await loadOpenApiDocument(openApiPath);

  const registry = new Registry();

  const modulesPath = nodePath.join(basePath, "js");

  await ensureDirectoryExists(modulesPath);

  // try {
  //   await fs.writeFile(
  //     nodePath.join(modulesPath, "package.json"),
  //     '{"type": "module"}'
  //   );
  // } catch {
  //   throw new Error(
  //     `could not write package.json to ${nodePath.join(
  //       modulesPath,
  //       "package.json"
  //     )}`
  //   );
  // }

  const transpiler = new Transpiler(basePath, modulesPath);

  await transpiler.watch();

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
