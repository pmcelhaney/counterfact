import { Registry } from "./registry";
import { Dispatcher } from "./dispatcher";
import { koaMiddleware } from "./koa-middleware";
import { Loader } from "./loader";

export async function counterfact(basePath: string) {
  const registry = new Registry();
  const dispatcher = new Dispatcher(registry);
  const loader = new Loader(basePath, registry);
  await loader.load();
  return { koaMiddleware: koaMiddleware(dispatcher), registry };
}
