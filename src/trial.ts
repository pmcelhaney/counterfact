import Koa from "koa";

import { ScriptedServer } from "./scripted-server";
import { Dispatcher } from "./dispatcher";
import { koaMiddleware } from "./koa-middleware";

const server = new ScriptedServer();
server.add("/hello", {
  async GET() {
    return await Promise.resolve({ body: "hello" });
  },
});

const dispatcher = new Dispatcher(server);
const middleware = koaMiddleware(dispatcher);

const app = new Koa();

app.use(middleware);

app.listen(3000);
console.log("listening on port 3000");
