import nodePath from "node:path";

import yaml from "js-yaml";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";
import Handlebars from "handlebars";

import { readFile } from "../util/read-file.js";

import { counterfact } from "./counterfact.js";

// eslint-disable-next-line no-underscore-dangle
const __dirname = nodePath.dirname(new URL(import.meta.url).pathname);

const DEFAULT_PORT = 3100;

Handlebars.registerHelper("escape_route", (route) =>
  route.replace(/[^\w/]/gu, "-")
);

function swaggerUi(app, openApiPath, url) {
  app.use(async (ctx, next) => {
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

export const landingPageTemplate = Handlebars.compile(
  await readFile(nodePath.join(__dirname, "../client/index.html.hbs"))
);

export async function start({
  basePath = process.cwd(),
  port = DEFAULT_PORT,
  openApiPath = nodePath.join(basePath, "../openapi.yaml"),
  includeSwaggerUi = false,
}) {
  const app = new Koa();

  const { koaMiddleware, contextRegistry, registry } = await counterfact(
    basePath,
    openApiPath
  );

  if (includeSwaggerUi) {
    swaggerUi(app, openApiPath, `//localhost:${port}`);
  }

  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact") {
      // eslint-disable-next-line require-atomic-updates
      ctx.body = await landingPageTemplate({
        basePath,
        routes: registry.routes,
        methods: ["get", "post", "put", "delete", "patch"],
      });

      return;
    }

    // eslint-disable-next-line node/callback-return
    await next();
  });

  app.use(bodyParser());

  app.use(koaMiddleware);

  app.listen(port);

  return { contextRegistry };
}
