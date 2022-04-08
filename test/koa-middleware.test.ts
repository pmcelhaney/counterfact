/* eslint-disable require-atomic-updates */

import { ScriptedServer } from "../src/scripted-server";
import { Dispatcher } from "../src/dispatcher";
import type { RequestMethod } from "../src/request-method";

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

describe("koa middleware", () => {
  it("passes the request to the dispatcher and returns the response", async () => {
    const server = new ScriptedServer();
    server.add("/validate", {
      async GET() {
        return await Promise.resolve({ body: "hello" });
      },
    });

    const dispatcher = new Dispatcher(server);
    const middleware = koaMiddleware(dispatcher);

    const ctx: Context = { request: { path: "/validate", method: "GET" } };
    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("hello");
  });
});
