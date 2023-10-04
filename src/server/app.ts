/* eslint-disable max-statements */
import nodePath, { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import createDebug from "debug";
import Handlebars from "handlebars";
import { createHttpTerminator, type HttpTerminator } from "http-terminator";
import yaml from "js-yaml";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import { readFile } from "../util/read-file.js";
import { counterfact as core } from "./counterfact.js";

const debug = createDebug("counterfact:server:start");

// eslint-disable-next-line @typescript-eslint/init-declarations
let httpTerminator: HttpTerminator | undefined;

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_PORT = 3100;

Handlebars.registerHelper("escape_route", (route: string) =>
  route.replaceAll(/[^\w/]/gu, "-"),
);

function openapi(openApiPath: string, url: string) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const openApiDocument = (await yaml.load(
        await readFile(openApiPath),
      )) as {
        host?: string;
        servers?: { description: string; url: string }[];
      };

      openApiDocument.servers ??= [];

      openApiDocument.servers.unshift({
        description: "Counterfact",
        url,
      });

      // OpenApi 2 support:
      openApiDocument.host = url;

      // eslint-disable-next-line require-atomic-updates
      ctx.body = yaml.dump(openApiDocument);

      return;
    }

    // eslint-disable-next-line  n/callback-return
    await next();
  };
}

function page(
  pathname: string,
  templateName: string,
  locals: { [key: string]: unknown },
) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const pathToHandlebarsTemplate = nodePath
      .join(__dirname, `../client/${templateName}.html.hbs`)
      .replaceAll("\\", "/");

    debug("pathToHandlebarsTemplate: %s", pathToHandlebarsTemplate);

    const render = Handlebars.compile(await readFile(pathToHandlebarsTemplate));

    if (ctx.URL.pathname === pathname) {
      ctx.body = render(locals);

      return;
    }

    // eslint-disable-next-line  n/callback-return
    await next();
  };
}

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

  app.use(openapi(openApiPath, `//localhost:${port}`));

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
    page("/counterfact/", "index", {
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
    page("/counterfact/rapidoc", "rapi-doc", {
      basePath,
      routes: registry.routes,
    }),
  );

  app.use(bodyParser());

  app.use(koaMiddleware);

  const server = app.listen({
    port,
  });

  httpTerminator = createHttpTerminator({
    server,
  });

  return { contextRegistry, start: startCounterfact, stop: stopCounterfact };
}
