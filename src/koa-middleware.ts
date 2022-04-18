import type { Context } from "./koa";
import type { Dispatcher } from "./dispatcher";

export function koaMiddleware(dispatcher: Readonly<Dispatcher>) {
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  return async function middleware(ctx: Context) {
    const { method, path, body } = ctx.request;
    const response = await dispatcher.request({
      method,
      path,
      body,
    });
    ctx.body = response.body;
    ctx.status = 200;
  };
}
