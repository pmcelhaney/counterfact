import { Registry } from "../src/registry.js";
import { Dispatcher } from "../src/dispatcher.js";
import { koaMiddleware } from "../src/koa-middleware.js";

describe("koa middleware", () => {
  it("passes the request to the dispatcher and returns the response", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      POST({ body }) {
        return {
          body: `Hello, ${body.name}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry);
    const middleware = koaMiddleware(dispatcher);
    const ctx = {
      request: { path: "/hello", method: "POST", body: { name: "Homer" } },
    };

    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
  });

  it("passes the status code", async () => {
    const registry = new Registry();

    registry.add("/not-modified", {
      GET() {
        return {
          status: 304,
        };
      },
    });

    const dispatcher = new Dispatcher(registry);
    const middleware = koaMiddleware(dispatcher);
    const ctx = {
      request: { path: "/not-modified", method: "GET" },
    };

    await middleware(ctx);

    expect(ctx.status).toBe(304);
  });
});
