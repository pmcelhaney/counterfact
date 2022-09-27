import nodePath from "node:path";

import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { koaSwagger } from "koa2-swagger-ui";

import { counterfact } from "./counterfact.js";
import { readFile } from "./read-file.js";

const DEFAULT_PORT = 3100;

export async function start(
  basePath = process.cwd(),
  port = DEFAULT_PORT,
  openApiPath = nodePath.join(basePath, "../openapi.yaml")
) {
  const app = new Koa();

  app.use(async (ctx, next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      // eslint-disable-next-line require-atomic-updates
      ctx.body = await readFile(openApiPath);

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

  app.use(bodyParser());

  const { koaMiddleware } = await counterfact(basePath, openApiPath);

  app.use(koaMiddleware);

  app.listen(port);
}
