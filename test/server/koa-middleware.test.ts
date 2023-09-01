import { ContextRegistry } from "../../src/server/context-registry.js";
import { Dispatcher } from "../../src/server/dispatcher.js";
import { koaMiddleware } from "../../src/server/koa-middleware.js";
import { Registry } from "../../src/server/registry.js";

function mockKoaProxy(options: { host: string }) {
  return function proxy(ctx: { mockProxyHost: string }) {
    ctx.mockProxyHost = options.host;
  };
}

describe("koa middleware", () => {
  it("passes the request to the dispatcher and returns the response", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      POST({ body }: { body: { name: string } }) {
        return {
          body: `Hello, ${body.name}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher);
    const ctx = {
      req: {
        path: "/hello",
      },

      request: { body: { name: "Homer" }, method: "POST", path: "/hello" },
    };

    await middleware(ctx, () => undefined);

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
      request: { method: "GET", path: "/not-modified" },
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
      { proxyEnabled: true, proxyUrl: "https://example.com" },
      mockKoaProxy,
    );
    const ctx = {
      request: { method: "GET", path: "/proxy" },
    };

    await middleware(ctx);

    expect(ctx.mockProxyHost).toBe("https://example.com");
  });
});
