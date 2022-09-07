import fs from "node:fs/promises";
import nodePath from "node:path";
import os from "node:os";

import yaml from "js-yaml";

import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { Transpiler } from "./transpiler.js";

async function loadOpenApiDocument(source) {
  try {
    return yaml.load(await fs.readFile(source, "utf8"));
  } catch {
    return undefined;
  }
}

// eslint-disable-next-line max-statements
export async function counterfact(
  basePath,
  context = {},
  openApiPath = nodePath.join(basePath, "../openapi.yaml")
) {
  const openApiDocument = await loadOpenApiDocument(openApiPath);

  const registry = new Registry(context);

  const modulesPath = `${await fs.mkdtemp(
    nodePath.join(os.tmpdir(), "counterfact-")
  )}/`;

  await fs.writeFile(
    nodePath.join(modulesPath, "package.json"),
    '{"type": "module"}'
  );

  const transpiler = new Transpiler(basePath, modulesPath);

  await transpiler.watch();

  const dispatcher = new Dispatcher(registry, openApiDocument);
  const moduleLoader = new ModuleLoader(
    nodePath.join(modulesPath, "paths"),
    registry
  );

  await moduleLoader.load();
  await moduleLoader.watch();

  return { koaMiddleware: koaMiddleware(dispatcher), registry, moduleLoader };
}
