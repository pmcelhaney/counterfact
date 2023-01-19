import { Registry } from "../../src/server/registry.js";
import { Dispatcher } from "../../src/server/dispatcher.js";
import { koaMiddleware } from "../../src/server/koa-middleware.js";
import { ContextRegistry } from "../../src/server/context-registry.js";

function mockKoaProxy(options) {
  return function proxy(ctx) {
    ctx.mockProxyHost = options.host;
  };
}

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

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
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

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher);
    const ctx = {
      request: { path: "/not-modified", method: "GET" },
    };

    await middleware(ctx);

    expect(ctx.status).toBe(304);
  });

  it("proxies when a proxyURL is passed in the options", async () => {
    const registry = new Registry();

    registry.add("/proxy", {
      GET() {
        throw new Error("should not be called because the proxy is used");
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(
      dispatcher,
      { proxyUrl: "https://example.com", proxyEnabled: true },
      mockKoaProxy
    );
    const ctx = {
      request: { path: "/proxy", method: "GET" },
    };

    await middleware(ctx);

    expect(ctx.mockProxyHost).toBe("https://example.com");
  });
});
