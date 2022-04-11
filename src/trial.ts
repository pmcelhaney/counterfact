import Koa from "koa";

import { ApiServer } from "./api-server";
import { Dispatcher } from "./dispatcher";
import { koaMiddleware } from "./koa-middleware";

const server = new ApiServer();
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
