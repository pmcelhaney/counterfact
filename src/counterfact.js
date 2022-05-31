import { Registry } from "./registry.js";
import { Dispatcher } from "./dispatcher.js";
import { koaMiddleware } from "./koa-middleware.js";
import { ModuleLoader } from "./module-loader.js";

export async function counterfact(basePath) {
  const registry = new Registry();
  const dispatcher = new Dispatcher(registry);
  const loader = new ModuleLoader(basePath, registry);

  await loader.load();
  await loader.watch();

  return { koaMiddleware: koaMiddleware(dispatcher), registry };
}
