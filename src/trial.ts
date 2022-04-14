import Koa from "koa";

import { Registry } from "./registry";
import { Dispatcher } from "./dispatcher";
import { koaMiddleware } from "./koa-middleware";

const registry = new Registry();
registry.add("/hello", {
  async GET() {
    return await Promise.resolve({ body: "hello" });
  },
});

const dispatcher = new Dispatcher(registry);
const middleware = koaMiddleware(dispatcher);

const app = new Koa();

app.use(middleware);

app.listen(3000);
console.log("listening on port 3000");
