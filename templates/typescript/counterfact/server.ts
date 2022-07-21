/* eslint-disable node/no-unsupported-features/node-builtins */

import { fileURLToPath } from "node:url";

import type { Middleware } from "koa";
import Koa from "koa";
import { counterfact } from "counterfact";
import { koaSwagger } from "koa2-swagger-ui";
import serve from "koa-static";
import bodyParser from "koa-bodyparser";
import open from "open";

import { context } from "./context/context.js";

const PORT = 3100;

const PATHS_DIRECTORY = fileURLToPath(new URL("paths/", import.meta.url));

const app = new Koa();

app.use(serve(fileURLToPath(new URL("public", import.meta.url))));

app.use(
  koaSwagger({
    routePrefix: "/docs",

    swaggerOptions: {
      url: "/openapi.yaml",
    },
  })
);

app.use(bodyParser());

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
const { koaMiddleware } = (await counterfact(PATHS_DIRECTORY, context)) as {
  koaMiddleware: Middleware;
};

app.use(koaMiddleware);

app.listen(PORT);
process.stdout.write("Counterfact is running.\n");
process.stdout.write(`See docs at http://localhost:${PORT}/docs\n`);
process.stdout.write(
  `A copy of the Open API spec is at ${fileURLToPath(
    new URL("public/openapi.yaml", import.meta.url)
  )}\n`
);
process.stdout.write(
  `The code that implements the API is under ${PATHS_DIRECTORY}\n`
);

if (process.argv.includes("--open")) {
  await open(`http://localhost:${PORT}/index.html`);
}
