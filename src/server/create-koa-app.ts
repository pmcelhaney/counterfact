import { pathToFileURL } from "node:url";

import createDebug from "debug";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import { adminApiMiddleware } from "./admin-api-middleware.js";
import type { Config } from "./config.js";
import type { ContextRegistry } from "./context-registry.js";
import { openapiMiddleware } from "./openapi-middleware.js";
import { pageMiddleware } from "./page-middleware.js";
import type { Registry } from "./registry.js";

const debug = createDebug("counterfact:server:create-koa-app");

export function createKoaApp(
  registry: Registry,
  koaMiddleware: Koa.Middleware,
  config: Config,
  contextRegistry: ContextRegistry,
) {
  const app = new Koa();

  app.use(
    openapiMiddleware(
      config.openApiPath,
      `//localhost:${config.port}${config.routePrefix}`,
    ),
  );

  app.use(
    koaSwagger({
      routePrefix: "/counterfact/swagger",

      swaggerOptions: {
        url: "/counterfact/openapi",
      },
    }),
  );

  if (config.startAdminApi) {
    app.use(adminApiMiddleware(registry, contextRegistry, config));
  }

  debug("basePath: %s", config.basePath);
  debug("routes", registry.routes);

  app.use(
    pageMiddleware("/counterfact/", "index", {
      basePath: config.basePath,
      methods: ["get", "post", "put", "delete", "patch"],

      openApiHref: config.openApiPath.includes("://")
        ? config.openApiPath
        : pathToFileURL(config.openApiPath).href,

      openApiPath: config.openApiPath,

      get routes() {
        return registry.routes;
      },
    }),
  );

  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact") {
      ctx.redirect("/counterfact/");

      return;
    }

    await next();
  });

  app.use(
    pageMiddleware("/counterfact/rapidoc", "rapi-doc", {
      basePath: config.basePath,

      get routes() {
        return registry.routes;
      },
    }),
  );

  app.use(bodyParser());

  app.use(async (ctx, next) => {
    await next();

    if (
      ctx.body !== null &&
      ctx.body !== undefined &&
      typeof ctx.body === "object" &&
      !Buffer.isBuffer(ctx.body)
    ) {
      ctx.body = JSON.stringify(ctx.body, null, 2);
      ctx.type = "application/json";
    }
  });

  app.use(koaMiddleware);

  return app;
}
