import koaProxy from "koa-proxy";

const HTTP_STATUS_CODE_OK = 200;

export function koaMiddleware(dispatcher, options = {}, proxy = koaProxy) {
  return async function middleware(ctx, next) {
    const { method, path, headers, body, query } = ctx.request;

    if (options.proxyEnabled && options.proxyUrl) {
      return proxy({ host: options.proxyUrl })(ctx, next);
    }

    // Always append CORS headers
    ctx.set("Access-Control-Allow-Origin", ctx.request?.headers?.origin || "*");
    ctx.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,POST,DELETE,PATCH");
    ctx.set(
      "Access-Control-Allow-Headers",
      ctx.request.headers["access-control-request-headers"]
    );
    ctx.set(
      "Access-Control-Expose-Headers",
      ctx.request.headers["access-control-request-headers"]
    );
    ctx.set("Access-Control-Allow-Credentials", "true");

    // If the method is OPTIONS then always return OK
    if (method === "OPTIONS") {
      ctx.status = HTTP_STATUS_CODE_OK;

      return undefined;
    }

    const response = await dispatcher.request({
      method,
      path,
      headers,
      body,
      query,
      req: ctx.req,
    });

    /* eslint-disable require-atomic-updates */
    ctx.body = response.body;
    ctx.status = response.status ?? HTTP_STATUS_CODE_OK;
    /* eslint-enable require-atomic-updates */

    return undefined;
  };
}
