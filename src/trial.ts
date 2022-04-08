import Koa from "koa";

import { ScriptedServer } from "./scripted-server";
import { Dispatcher } from "./dispatcher";
import type { RequestMethod } from "./request-method";

interface Context {
  request: {
    path: string;
    method: RequestMethod;
  };
  status?: number;
  body?: string;
}

function koaMiddleware(dispatcher: Readonly<Dispatcher>) {
  // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  return async function middleware(ctx: Context) {
    const { method, path } = ctx.request;
    const response = await dispatcher.request({ method, path });
    ctx.body = response.body;
    ctx.status = 200;
  };
}

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
