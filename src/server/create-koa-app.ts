import { pathToFileURL } from "node:url";

import createDebug from "debug";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import type { Config } from "./config.js";
import { openapiMiddleware } from "./openapi-middleware.js";
import { pageMiddleware } from "./page-middleware.js";
import type { Registry } from "./registry.js";

const debug = createDebug("counterfact:server:create-koa-app");

// eslint-disable-next-line max-statements
export function createKoaApp(
  registry: Registry,
  koaMiddleware: Koa.Middleware,
  config: Config,
) {
  const app = new Koa();

  app.use(openapiMiddleware(config.openApiPath, `//localhost:${config.port}`));

  app.use(
    koaSwagger({
      routePrefix: "/counterfact/swagger",

      swaggerOptions: {
        url: "/counterfact/openapi",
      },
    }),
  );

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

      routes: registry.routes,
    }),
  );

  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact") {
      ctx.redirect("/counterfact/");

      return;
    }

    // eslint-disable-next-line  n/callback-return
    await next();
  });

  app.use(
    pageMiddleware("/counterfact/rapidoc", "rapi-doc", {
      basePath: config.basePath,
      routes: registry.routes,
    }),
  );

  app.use(bodyParser());

  app.use(koaMiddleware);

  return app;
}
