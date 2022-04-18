import { Registry } from "../src/registry";
import { Dispatcher } from "../src/dispatcher";
import { koaMiddleware } from "../src/koa-middleware";
import type { Context } from "../src/koa";

describe("koa middleware", () => {
  it("passes the request to the dispatcher and returns the response", async () => {
    const registry = new Registry();
    registry.add("/hello", {
      async GET({ body }) {
        return await Promise.resolve({
          body: `Hello, ${body.name}!`,
        });
      },
    });

    const dispatcher = new Dispatcher(registry);
    const middleware = koaMiddleware(dispatcher);

    const ctx: Context = {
      request: { path: "/hello", method: "GET", body: { name: "Homer" } },
    };
    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
  });
});
