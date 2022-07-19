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
console.log("Try these URLs:");
console.log(`http://localhost:${PORT}/hello/world`);
console.log(`http://localhost:${PORT}/hello/friends`);
console.log(`http://localhost:${PORT}/hello/kitty`);
console.log(`http://localhost:${PORT}/hello/world?greeting=Hi`);
console.log(`http://localhost:${PORT}/count`);
console.log(`http://localhost:${PORT}/user`);
