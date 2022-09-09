import fs from "node:fs/promises";
import nodePath from "node:path";

import yaml from "js-yaml";

import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";

async function loadOpenApiDocument(source) {
  try {
    return yaml.load(await fs.readFile(source, "utf8"));
  } catch {
    return undefined;
  }
}

export async function counterfact(
  basePath,
  context = {},
  openApiPath = nodePath.join(basePath, "../openapi.yaml")
) {
  const openApiDocument = await loadOpenApiDocument(openApiPath);

  const registry = new Registry(context);

  const dispatcher = new Dispatcher(registry, openApiDocument);
  const moduleLoader = new ModuleLoader(basePath, registry);

  await moduleLoader.load();
  await moduleLoader.watch();

  return { koaMiddleware: koaMiddleware(dispatcher), registry, moduleLoader };
}

// adding this comment to make CI kick off -- delete me
