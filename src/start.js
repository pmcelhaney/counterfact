import Koa from "koa";
import bodyParser from "koa-bodyparser";

import { counterfact } from "./counterfact.js";

const DEFAULT_PORT = 3100;

export async function start(basePath = process.cwd(), port = DEFAULT_PORT) {
  // eslint-disable-next-line import/no-unresolved, node/no-unsupported-features/es-syntax
  const context = await import("./context/context.js").catch(() => ({}));

  const app = new Koa();

  app.use(bodyParser());

  const { koaMiddleware } = await counterfact(basePath, context);

  app.use(koaMiddleware);

  app.listen(port);
  process.stdout.write(`Counterfact is running on port ${port}.\n`);
}
