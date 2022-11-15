import nodePath from "node:path";

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";
import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import { counterfact } from "./counterfact.js";

// eslint-disable-next-line no-underscore-dangle
const __dirname = nodePath.dirname(new URL(import.meta.url).pathname);

const DEFAULT_PORT = 3100;

export function swaggerUi(app, openApiPath, port) {
  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      const openApiDocument = await yaml.load(await readFile(openApiPath));

      openApiDocument.servers ??= [];

      openApiDocument.servers.unshift({
        description: "Counterfact",
        url: `//localhost:${port}`,
      });

      // eslint-disable-next-line require-atomic-updates
      ctx.body = yaml.dump(openApiDocument);

      return;
    }

    // eslint-disable-next-line node/callback-return
    await next();
  });

  app.use(
    koaSwagger({
      routePrefix: "/counterfact/swagger",

      swaggerOptions: {
        url: "/counterfact/openapi",
      },
    })
  );
}

export async function landingPageBody(basePath) {
  const body = await readFile(nodePath.join(__dirname, "../client/index.html"));

  return body.replaceAll("{{basePath}}", basePath);
}

export function landingPage(app, basePath) {
  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact") {
      // eslint-disable-next-line require-atomic-updates
      ctx.body = await landingPageBody(basePath);

      return;
    }

    // eslint-disable-next-line node/callback-return
    await next();
  });
}

export async function start({
  basePath = process.cwd(),
  port = DEFAULT_PORT,
  openApiPath = nodePath.join(basePath, "../openapi.yaml"),
  includeSwaggerUi = false,
}) {
  const app = new Koa();

  if (includeSwaggerUi) {
    swaggerUi(app, openApiPath, port);
  }

  landingPage(app, basePath);

  app.use(bodyParser());

  const { koaMiddleware, contextRegistry } = await counterfact(
    basePath,
    openApiPath
  );

  app.use(koaMiddleware);

  app.listen(port);

  return { contextRegistry };
}
