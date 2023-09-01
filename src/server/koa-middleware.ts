import type { Middleware, Request as KoaRequest } from "koa";
import koaProxy from "koa-proxy";

import type { Dispatcher } from "./dispatcher.js";
import type { HttpMethods } from "./registry.js";

const HTTP_STATUS_CODE_OK = 200;

export function koaMiddleware(
  dispatcher: Dispatcher,
  { proxyEnabled = false, proxyUrl = "" } = {},
  proxy = koaProxy,
): Middleware {
  return async function middleware(ctx, next) {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const { body, headers, method, path, query } = ctx.request as KoaRequest & {
      body: unknown;
      method: HttpMethods;
    };

    if (proxyEnabled && proxyUrl) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return proxy({ host: proxyUrl })(ctx, next);
    }

    const response = await dispatcher.request({
      body,
      /* @ts-expect-error the value of a header can be an array and we don't have a solution for that yet */
      headers,
      method,
      path,
      /* @ts-expect-error the value of a querystring item can be an array and we don't have a solution for that yet */
      query,
      req: { path: "", ...ctx.req },
    });

    /* eslint-disable require-atomic-updates */
    ctx.body = response.body;
    ctx.status = response.status ?? HTTP_STATUS_CODE_OK;
    /* eslint-enable require-atomic-updates */

    return undefined;
  };
}
