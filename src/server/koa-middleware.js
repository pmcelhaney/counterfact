import koaProxy from "koa-proxy";

const HTTP_STATUS_CODE_OK = 200;

function addCors(ctx, headers) {
  // Always append CORS headers, reflecting back the headers requested if any
  ctx.set("Access-Control-Allow-Origin", headers?.origin || "*");
  ctx.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,POST,DELETE,PATCH");
  ctx.set(
    "Access-Control-Allow-Headers",
    headers?.["access-control-request-headers"]
  );
  ctx.set(
    "Access-Control-Expose-Headers",
    headers?.["access-control-request-headers"]
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
}

export function koaMiddleware(dispatcher, options = {}, proxy = koaProxy) {
  return async function middleware(ctx, next) {
    const { method, path, headers, body, query } = ctx.request;

    if (options.proxyEnabled && options.proxyUrl) {
      return proxy({ host: options.proxyUrl })(ctx, next);
    }

    addCors(ctx, headers);

    // If the method is OPTIONS then always return OK
    if (method === "OPTIONS") {
      ctx.status = HTTP_STATUS_CODE_OK;
    } else {
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
    }

    return undefined;
  };
}
