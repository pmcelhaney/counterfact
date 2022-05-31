import { fileURLToPath } from "node:url";

import Koa from "koa";

import { counterfact } from "../src/counterfact.js";

const PORT = 3100;

const app = new Koa();

const { koaMiddleware } = await counterfact(
  fileURLToPath(new URL("routes/", import.meta.url))
);

app.use(koaMiddleware);

app.listen(PORT);
console.log(`Open http://localhost:${PORT}/hello/world`);
