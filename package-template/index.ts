/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */

// The above ESLint rules are turned off mainly because Counterfact itself is not written in TypeScript yet.

import { fileURLToPath } from "node:url";
import nodePath from "node:path";

import Koa from "koa";
import { counterfact } from "counterfact";
import { koaSwagger } from "koa2-swagger-ui";
import serve from "koa-static";
import bodyParser from "koa-bodyparser";

import { context } from "./context/context.js";

const PORT = 3100;

const app = new Koa();

app.use(serve("./"));

app.use(
  koaSwagger({
    routePrefix: "/docs",

    swaggerOptions: {
      url: "/openapi/openapi.yaml",
    },
  })
);

app.use(bodyParser());

const { koaMiddleware } = await counterfact(
  fileURLToPath(new URL("paths/", import.meta.url)),
  context
);

app.use(koaMiddleware);

app.listen(PORT);
console.log("Counterfact is running.");
console.log(`See docs at http://localhost:${PORT}/docs`);
console.log(
  `A copy of the Open API spec is at ${nodePath.resolve(
    "./openapi/openapi.yaml"
  )}`
);
console.log(
  `The code that implements the API is under ${nodePath.resolve("./paths/")}`
);
