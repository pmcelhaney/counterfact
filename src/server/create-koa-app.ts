import createDebug from "debug";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import type { ApiRunner } from "../api-runner.js";
import { adminApiMiddleware } from "./admin-api-middleware.js";
import type { Config } from "./config.js";
import { routesMiddleware } from "./koa-middleware.js";
import { openapiMiddleware } from "./openapi-middleware.js";

const debug = createDebug("counterfact:server:create-koa-app");

/**
 * Builds and configures the Koa application with all built-in middleware.
 *
 * The middleware stack (in order) is:
 * 1. OpenAPI document serving at `/counterfact/openapi`
 * 2. Swagger UI at `/counterfact/swagger`
 * 3. Admin API (when `startAdminApi` is `true`) at `/_counterfact/api/`
 * 4. Redirect `/counterfact` → `/counterfact/swagger`
 * 5. Body parser
 * 6. JSON serialisation of object bodies
 * 7. Route-dispatching middleware
 *
 * @param runner - The ApiRunner instance providing the dispatcher, registry,
 *   context registry, OpenAPI path, and route prefix.
 * @param port - TCP port the HTTP server will listen on (used in the OpenAPI
 *   base URL shown in Swagger UI).
 * @param startAdminApi - When `true`, mounts the Admin API middleware.
 * @param adminApiToken - Optional bearer token that protects the Admin API.
 * @param alwaysFakeOptionals - When `true`, JSON Schema Faker generates values
 *   for all optional fields.
 * @param basePath - Absolute path to the directory containing generated route
 *   files (used for debug logging).
 * @param buildCache - When `true`, transpile TypeScript route files to a
 *   `.cache/` directory.
 * @param generate - Controls which artefacts are (re-)generated from the spec.
 * @param proxyPaths - Per-path proxy toggle map.
 * @param proxyUrl - Base URL of the upstream server used when proxying.
 * @param startRepl - When `true`, launch the interactive REPL after startup.
 * @param startServer - When `true`, start the Koa HTTP server.
 * @param validateRequests - When `true`, validate requests against the spec.
 * @param validateResponses - When `true`, validate responses against the spec.
 * @param watch - Controls which artefacts are watched for live reload.
 * @returns A configured Koa application (not yet listening).
 */
export function createKoaApp({
  runner,
  adminApiToken,
  alwaysFakeOptionals,
  basePath,
  buildCache,
  generate,
  port,
  proxyPaths,
  proxyUrl,
  startAdminApi,
  startRepl,
  startServer,
  validateRequests,
  validateResponses,
  watch,
}: {
  runner: ApiRunner;
  adminApiToken?: string;
  alwaysFakeOptionals: boolean;
  basePath: string;
  buildCache: boolean;
  generate: Config["generate"];
  port: number;
  proxyPaths: Map<string, boolean>;
  proxyUrl: string;
  startAdminApi: boolean;
  startRepl: boolean;
  startServer: boolean;
  validateRequests: boolean;
  validateResponses: boolean;
  watch: Config["watch"];
}) {
  const { openApiPath, routePrefix } = runner;

  // Reconstruct a mutable config object so that downstream middleware
  // (adminApiMiddleware, routesMiddleware) share the same reference and
  // mutations (e.g. proxy updates via the Admin API) are immediately visible
  // to subsequent requests.
  const config: Config = {
    adminApiToken,
    alwaysFakeOptionals,
    basePath,
    buildCache,
    generate,
    openApiPath,
    port,
    proxyPaths,
    proxyUrl,
    routePrefix,
    startAdminApi,
    startRepl,
    startServer,
    validateRequests,
    validateResponses,
    watch,
  };

  const app = new Koa();

  app.use(
    openapiMiddleware([
      {
        path: openApiPath,
        baseUrl: `//localhost:${port}${routePrefix}`,
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

  if (startAdminApi) {
    app.use(
      adminApiMiddleware(runner.registry, runner.contextRegistry, config),
    );
  }

  debug("basePath: %s", basePath);

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

  app.use(routesMiddleware(runner.dispatcher, config));

  return app;
}
