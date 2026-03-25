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

export interface SpecEntry {
  config: Config;
  contextRegistry: ContextRegistry;
  koaMiddleware: Koa.Middleware;
  registry: Registry;
}

export function createKoaApp(entries: SpecEntry[]) {
  if (entries.length === 0) {
    throw new Error("At least one spec entry is required");
  }

  const app = new Koa();

  const primaryEntry = entries[0]!;
  const { config: primaryConfig, contextRegistry, registry } = primaryEntry;

  for (const entry of entries) {
    const { routePrefix } = entry.config;
    const openapiServePath = routePrefix
      ? `/counterfact/openapi${routePrefix}`
      : "/counterfact/openapi";
    const swaggerPrefix = routePrefix
      ? `/counterfact/swagger${routePrefix}`
      : "/counterfact/swagger";

    app.use(
      openapiMiddleware(
        entry.config.openApiPath,
        `//localhost:${entry.config.port}${routePrefix}`,
        openapiServePath,
      ),
    );

    app.use(
      koaSwagger({
        routePrefix: swaggerPrefix,

        swaggerOptions: {
          url: openapiServePath,
        },
      }),
    );
  }

  if (primaryConfig.startAdminApi) {
    app.use(adminApiMiddleware(registry, contextRegistry, primaryConfig));
  }

  debug("basePath: %s", primaryConfig.basePath);
  debug("routes", registry.routes);

  app.use(
    pageMiddleware("/counterfact/", "index", {
      basePath: primaryConfig.basePath,
      methods: ["get", "post", "put", "delete", "patch"],

      openApiHref: primaryConfig.openApiPath.includes("://")
        ? primaryConfig.openApiPath
        : pathToFileURL(primaryConfig.openApiPath).href,

      openApiPath: primaryConfig.openApiPath,

      get routes() {
        return entries.flatMap((entry) => entry.registry.routes);
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
      basePath: primaryConfig.basePath,

      get routes() {
        return entries.flatMap((entry) => entry.registry.routes);
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

  for (const entry of entries) {
    app.use(entry.koaMiddleware);
  }

  return app;
}
