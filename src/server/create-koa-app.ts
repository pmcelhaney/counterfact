import createDebug from "debug";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import type { Config } from "./config.js";
import { openapiMiddleware } from "./openapi-middleware.js";

const debug = createDebug("counterfact:server:create-koa-app");

/**
 * Builds and configures the Koa application with all built-in middleware.
 *
 * The middleware stack (in order) is:
 * 1. OpenAPI document serving at `/counterfact/openapi`
 * 2. Swagger UI at `/counterfact/swagger`
 * 3. Admin API (when provided) at `/_counterfact/api/`
 * 4. Redirect `/counterfact` → `/counterfact/swagger`
 * 5. Body parser
 * 6. JSON serialisation of object bodies
 * 7. Route-dispatching middleware
 *
 * @param routesMiddleware - The pre-built route-dispatching middleware.
 * @param config - Server configuration.
 * @param adminApiMiddleware - Optional pre-built admin API middleware; when
 *   provided it is mounted at `/_counterfact/api/`.
 * @returns A configured Koa application (not yet listening).
 */
export function createKoaApp(
  routesMiddleware: Koa.Middleware,
  config: Config,
  adminApiMiddleware?: Koa.Middleware,
) {
  const app = new Koa();

  app.use(
    openapiMiddleware([
      {
        path: config.openApiPath,
        baseUrl: `//localhost:${config.port}${config.routePrefix}`,
      },
    ]),
  );

  app.use(
    koaSwagger({
      routePrefix: "/counterfact/swagger",

      swaggerOptions: {
        url: "/counterfact/openapi",
      },
    }),
  );

  if (adminApiMiddleware) {
    app.use(adminApiMiddleware);
  }

  debug("basePath: %s", config.basePath);

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

  app.use(routesMiddleware);

  return app;
}
