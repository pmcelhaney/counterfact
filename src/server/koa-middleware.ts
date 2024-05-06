import type { IncomingHttpHeaders } from "node:http";

import type Koa from "koa";
import koaProxy from "koa-proxy";

import type { Config } from "./config.js";
import type { Dispatcher } from "./dispatcher.js";
import type { HttpMethods } from "./registry.js";

const HTTP_STATUS_CODE_OK = 200;

function addCors(ctx: Koa.ExtendableContext, headers?: IncomingHttpHeaders) {
  // Always append CORS headers, reflecting back the headers requested if any

  ctx.set("Access-Control-Allow-Origin", headers?.origin ?? "*");
  ctx.set("Access-Control-Allow-Methods", "GET,HEAD,PUT,POST,DELETE,PATCH");
  ctx.set(
    "Access-Control-Allow-Headers",
    headers?.["access-control-request-headers"] ?? [],
  );
  ctx.set(
    "Access-Control-Expose-Headers",
    headers?.["access-control-request-headers"] ?? [],
  );
  ctx.set("Access-Control-Allow-Credentials", "true");
}

function getAuthObject(
  ctx: Koa.ExtendableContext & { user?: { [key: string]: string } },
):
  | {
      password?: string;
      username?: string;
    }
  | undefined {
  const authHeader = ctx.request.headers.authorization;
  if (authHeader === undefined) {
    return undefined;
  }

  const [, base64Credentials] = authHeader.split(" ");

  if (base64Credentials === undefined) {
    return undefined;
  }

  const user = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [username, password] = user.split(":");
  return { password, username };
}

export function koaMiddleware(
  dispatcher: Dispatcher,
  config: Config,
  proxy = koaProxy,
): Koa.Middleware {
  // eslint-disable-next-line max-statements
  return async function middleware(ctx, next) {
    const { proxyEnabled, proxyUrl, routePrefix } = config;

    if (!ctx.request.path.startsWith(routePrefix)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return await next();
    }

    const auth = getAuthObject(ctx);

    /* @ts-expect-error the body comes from koa-bodyparser, not sure how to fix this */
    const { body, headers, query } = ctx.request;

    const path = ctx.request.path.slice(routePrefix.length);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const method = ctx.request.method as HttpMethods;

    if (proxyEnabled && proxyUrl) {
      /* @ts-expect-error the body comes from koa-bodyparser, not sure how to fix this */
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return proxy({ host: proxyUrl })(ctx, next);
    }

    addCors(ctx, headers);

    if (method === "OPTIONS") {
      ctx.status = HTTP_STATUS_CODE_OK;
      return undefined;
    }

    const response = await dispatcher.request({
      auth,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
    if (response.headers) {
      for (const [key, value] of Object.entries(response.headers)) {
        ctx.set(key, value.toString());
      }
    }
    ctx.status = response.status ?? HTTP_STATUS_CODE_OK;
    /* eslint-enable require-atomic-updates */

    return undefined;
  };
}
