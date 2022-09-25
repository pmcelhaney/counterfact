/* eslint-disable import/max-dependencies */
import fs from "node:fs/promises";
import nodePath from "node:path";
import os from "node:os";

import $RefParser from "json-schema-ref-parser";
import yaml from "js-yaml";

import { readFile } from "./read-file.js";
import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";
import { Transpiler } from "./transpiler.js";
import { ContextRegistry } from "./context-registry.js";

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

  const modulesPath = `${await fs.mkdtemp(
    nodePath.join(os.tmpdir(), "counterfact-")
  )}/`;

  try {
    await fs.writeFile(
      nodePath.join(modulesPath, "package.json"),
      '{"type": "module"}'
    );
  } catch {
    throw new Error("could not write package.json");
  }

  const transpiler = new Transpiler(basePath, modulesPath);

  await transpiler.watch();

  const dispatcher = new Dispatcher(
    registry,
    new ContextRegistry(),
    openApiDocument
  );
  const moduleLoader = new ModuleLoader(
    nodePath.join(modulesPath, "paths"),
    registry
  );

  await moduleLoader.load();

  await moduleLoader.watch();

  return { koaMiddleware: koaMiddleware(dispatcher), registry, moduleLoader };
}
