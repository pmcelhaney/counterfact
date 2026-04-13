import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import type { Config } from "./config.js";
import { openapiMiddleware } from "./openapi-middleware.js";

/**
 * Builds and configures the Koa application with all built-in middleware.
 *
 * The middleware stack (in order) is:
 * 1. OpenAPI document serving at `/counterfact/openapi`
 * 2. Swagger UI at `/counterfact/swagger`
 * 3. Admin API middleware (when provided) at `/_counterfact/api/`
 * 4. Redirect `/counterfact` → `/counterfact/swagger`
 * 5. Body parser
 * 6. JSON serialisation of object bodies
 * 7. Route-dispatching middlewares (one per spec; each is `use()`d in order)
 *
 * @param koaMiddlewares - One or more pre-built route-dispatching middlewares.
 *   Each middleware is registered via `app.use()` in the order provided.
 *   Each middleware already knows its own `routePrefix` and calls `next()` for
 *   paths outside that prefix.
 * @param config - Server configuration.
 * @param adminMiddleware - Optional pre-built admin API middleware.  When
 *   provided it is registered before the route-dispatching middlewares.
 * @returns A configured Koa application (not yet listening).
 */
export function createKoaApp(
  koaMiddlewares: Koa.Middleware | Koa.Middleware[],
  config: Config,
  adminMiddleware?: Koa.Middleware,
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

  if (adminMiddleware) {
    app.use(adminMiddleware);
  }

  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact") {
      ctx.redirect("/counterfact/swagger");

      return;
    }

    await next();
  });

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

  const middlewareList = Array.isArray(koaMiddlewares)
    ? koaMiddlewares
    : [koaMiddlewares];

  for (const middleware of middlewareList) {
    app.use(middleware);
  }

  return app;
}
