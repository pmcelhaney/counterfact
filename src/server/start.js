/* eslint-disable max-statements */
import nodePath, { dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

import yaml from "js-yaml";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";
import Handlebars from "handlebars";

import { readFile } from "../util/read-file.js";

import { counterfact } from "./counterfact.js";

// eslint-disable-next-line no-underscore-dangle
const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_PORT = 3100;

Handlebars.registerHelper("escape_route", (route) =>
  route.replaceAll(/[^\w/]/gu, "-")
);

function openapi(openApiPath, url) {
  return async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      const openApiDocument = await yaml.load(await readFile(openApiPath));

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

function page(pathname, templateName, locals) {
  return async (ctx, next) => {
    const render = Handlebars.compile(
      await readFile(
        nodePath
          .join(__dirname, `../client/${templateName}.html.hbs`)
          .replaceAll("\\", "/")
      )
    );

    if (ctx.URL.pathname === pathname) {
      // eslint-disable-next-line require-atomic-updates
      ctx.body = await render(locals);

      return;
    }

    // eslint-disable-next-line  n/callback-return
    await next();
  };
}

export async function start(config) {
  const {
    basePath = process.cwd(),
    openApiPath = nodePath
      .join(basePath, "../openapi.yaml")
      .replaceAll("\\", "/"),
    port = DEFAULT_PORT,
  } = config;

  const app = new Koa();

  const { koaMiddleware, contextRegistry, registry } = await counterfact(
    basePath,
    openApiPath,
    config
  );

  app.use(openapi(openApiPath, `//localhost:${port}`));

  app.use(
    koaSwagger({
      routePrefix: "/counterfact/swagger",

      swaggerOptions: {
        url: "/counterfact/openapi",
      },
    })
  );

  app.use(
    page("/counterfact/", "index", {
      basePath,
      routes: registry.routes,
      methods: ["get", "post", "put", "delete", "patch"],
      openApiPath,

      openApiHref: openApiPath.includes("://")
        ? openApiPath
        : pathToFileURL(openApiPath).href,
    })
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
    page("/counterfact/rapidoc", "rapi-doc", {
      basePath,
      routes: registry.routes,
    })
  );

  app.use(bodyParser());

  app.use(koaMiddleware);

  app.listen(port);

  return { contextRegistry };
}
