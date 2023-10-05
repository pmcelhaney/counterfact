/* eslint-disable max-statements */
import nodePath from "node:path";
import { pathToFileURL } from "node:url";

import createDebug from "debug";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import { core } from "./core.js";
import { openapiMiddleware } from "./openapi-middleware.js";
import { pageMiddleware } from "./page-middleware.js";

const debug = createDebug("counterfact:server:start");

// eslint-disable-next-line @typescript-eslint/init-declarations
let httpTerminator: HttpTerminator | undefined;

const DEFAULT_PORT = 3100;

export async function counterfact(config: {
  basePath: string;
  openApiPath: string;
  port: number;
}) {
  const {
    basePath = process.cwd().replaceAll("\\", "/"),
    openApiPath = nodePath
      .join(basePath, "../openapi.yaml")
      .replaceAll("\\", "/"),
    port = DEFAULT_PORT,
  } = config;

  const app = new Koa();

  const {
    contextRegistry,
    koaMiddleware,
    registry,
    start: startCounterfact,
    stop: stopCounterfact,
  } = await core(basePath, openApiPath, config);

  app.use(openapiMiddleware(openApiPath, `//localhost:${port}`));

  app.use(
    koaSwagger({
      routePrefix: "/counterfact/swagger",

      swaggerOptions: {
        url: "/counterfact/openapi",
      },
    }),
  );

  debug("basePath: %s", basePath);
  debug("routes", registry.routes);

  app.use(
    pageMiddleware("/counterfact/", "index", {
      basePath,
      methods: ["get", "post", "put", "delete", "patch"],

      openApiHref: openApiPath.includes("://")
        ? openApiPath
        : pathToFileURL(openApiPath).href,

      openApiPath,

      routes: registry.routes,
    }),
  );

  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact") {
      ctx.redirect("/counterfact/");

      return;
    }

    if (ctx.URL.pathname === "/counterfact/stop") {
      debug("Stopping server...");
      await stopCounterfact();
      await httpTerminator?.terminate();
      debug("Server stopped.");

      return;
    }
    // eslint-disable-next-line  n/callback-return
    await next();
  });

  app.use(
    pageMiddleware("/counterfact/rapidoc", "rapi-doc", {
      basePath,
      routes: registry.routes,
    }),
  );

  app.use(bodyParser());

  app.use(koaMiddleware);

  async function start() {
    await startCounterfact();

    const server = app.listen({
      port,
    });

    httpTerminator = createHttpTerminator({
      server,
    });
  }

  async function stop() {
    await stopCounterfact();
    await httpTerminator?.terminate();
  }

  return { contextRegistry, start, stop };
}
