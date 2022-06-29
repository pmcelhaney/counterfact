import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";

export async function counterfact(basePath, context = {}) {
  const registry = new Registry(context);
  const dispatcher = new Dispatcher(registry);
  const moduleLoader = new ModuleLoader(basePath, registry);

  await moduleLoader.load();
  await moduleLoader.watch();

  return { koaMiddleware: koaMiddleware(dispatcher), registry, moduleLoader };
}
