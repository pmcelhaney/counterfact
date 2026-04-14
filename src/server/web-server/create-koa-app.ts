import createDebug from "debug";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import type { ApiRunner } from "../../api-runner.js";
import { adminApiMiddleware } from "./admin-api-middleware.js";
import type { Config } from "../config.js";
import { routesMiddleware } from "./koa-middleware.js";
import { openapiMiddleware } from "./openapi-middleware.js";

const debug = createDebug("counterfact:server:create-koa-app");

/**
 * Builds and configures the Koa application with all built-in middleware.
 *
 * The middleware stack (in order) is:
 * 1. OpenAPI document serving at `/counterfact/openapi`
 * 2. Swagger UI at `/counterfact/swagger`
 * 3. Admin API (when `config.startAdminApi` is `true`) at `/_counterfact/api`
 * 4. Redirect `/counterfact` → `/counterfact/swagger`
 * 5. Body parser
 * 6. JSON serialisation of object bodies
 * 7. Route-dispatching middleware at `config.routePrefix`
 *
 * @param runner - The ApiRunner instance providing the dispatcher, registry,
 *   context registry, OpenAPI path, and route prefix.
 * @param config - Server configuration.
 * @returns A configured Koa application (not yet listening).
 */
export function createKoaApp({
  runner,
  config,
}: {
  runner: ApiRunner;
  config: Config;
}) {
  const app = new Koa();

  app.use(
    openapiMiddleware("/counterfact/openapi", {
      path: runner.openApiPath,
      baseUrl: `//localhost:${config.port}${runner.routePrefix}`,
    }),
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
    app.use(
      adminApiMiddleware(
        "/_counterfact/api",
        runner.registry,
        runner.contextRegistry,
        config,
      ),
    );
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

  app.use(routesMiddleware(config.routePrefix, runner.dispatcher, config));

  return app;
}
