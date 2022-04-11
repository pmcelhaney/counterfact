import { ApiServer } from "../src/api-server";
import { Dispatcher } from "../src/dispatcher";
import { koaMiddleware } from "../src/koa-middleware";
import type { Context } from "../src/koa";

describe("koa middleware", () => {
  it("passes the request to the dispatcher and returns the response", async () => {
    const server = new ApiServer();
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
