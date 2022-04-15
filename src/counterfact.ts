import { Registry } from "./registry";
import { Dispatcher } from "./dispatcher";
import { koaMiddleware } from "./koa-middleware";
import { ModuleLoader } from "./module-loader";

export async function counterfact(basePath: string) {
  const registry = new Registry();
  const dispatcher = new Dispatcher(registry);
  const loader = new ModuleLoader(basePath, registry);
  await loader.load();
  await loader.watch();
  return { koaMiddleware: koaMiddleware(dispatcher), registry };
}
