import { Registry } from "../src/registry";
import { Dispatcher } from "../src/dispatcher";
import { koaMiddleware } from "../src/koa-middleware";
import type { Context } from "../src/koa";

describe("koa middleware", () => {
  it("passes the request to the dispatcher and returns the response", async () => {
    const registry = new Registry();
    registry.add("/validate", {
      async GET() {
        return await Promise.resolve({ body: "hello" });
      },
    });

    const dispatcher = new Dispatcher(registry);
    const middleware = koaMiddleware(dispatcher);

    const ctx: Context = { request: { path: "/validate", method: "GET" } };
    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("hello");
  });
});
