import nodePath from "node:path";

import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { counterfact } from "./counterfact.js";

const DEFAULT_PORT = 3100;

export async function start(
  basePath = process.cwd(),
  port = DEFAULT_PORT,
  openApiPath = nodePath.join(basePath, "../openapi.yaml")
) {
  const app = new Koa();

  app.use(bodyParser());

  const { koaMiddleware } = await counterfact(basePath, openApiPath);

  app.use(koaMiddleware);

  app.listen(port);
  process.stdout.write(`Counterfact is running on port ${port}.\n`);
}
