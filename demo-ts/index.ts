/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable node/no-unsupported-features/node-builtins */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */

import { fileURLToPath } from "node:url";

import Koa from "koa";
import { counterfact } from "counterfact";
import { koaSwagger } from "koa2-swagger-ui";
import serve from "koa-static";
import bodyParser from "koa-bodyparser";

import { context } from "./context/context.js";

const PORT = 3100;

const app = new Koa();

app.use(serve("../"));

app.use(
  koaSwagger({
    routePrefix: "/swagger", // host at /swagger instead of default /docs

    swaggerOptions: {
      url: "/petstore.yaml", // example path to json
    },
  })
);

app.use(bodyParser());

// app.use(async (ctx, next) => {
//   console.log("body", ctx.request.body);
//   await next();
//   console.log("request", ctx);
// });

const { koaMiddleware } = await counterfact(
  fileURLToPath(new URL("paths/", import.meta.url)),
  context
);

app.use(koaMiddleware);

app.listen(PORT);
console.log("Try these URLs:");
console.log(`http://localhost:${PORT}/hello/world`);
console.log(`http://localhost:${PORT}/hello/friends`);
console.log(`http://localhost:${PORT}/hello/kitty`);
console.log(`http://localhost:${PORT}/hello/world?greeting=Hi`);
console.log(`http://localhost:${PORT}/count`);
