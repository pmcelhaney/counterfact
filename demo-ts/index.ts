/* eslint-disable no-console, node/no-unpublished-import */
import { fileURLToPath } from "node:url";

// eslint-disable-next-line import/no-extraneous-dependencies
import Koa from "koa";

import { counterfact } from "../src/counterfact";

const PORT = 3100;

const app = new Koa();

const { koaMiddleware } = await counterfact(
  fileURLToPath(new URL("routes/", import.meta.url))
);

app.use(koaMiddleware);

app.listen(PORT);
console.log("Try these URLs:");
console.log(`http://localhost:${PORT}/hello/world`);
console.log(`http://localhost:${PORT}/hello/friends`);
console.log(`http://localhost:${PORT}/hello/kitty`);
console.log(`http://localhost:${PORT}/hello/world?greeting=Hi`);
console.log(`http://localhost:${PORT}/count`);
