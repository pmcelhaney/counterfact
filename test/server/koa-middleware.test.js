// eslint-disable-next-line import/no-extraneous-dependencies, node/no-extraneous-import, @typescript-eslint/no-shadow, no-shadow
import { jest } from "@jest/globals";

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
      request: {
        path: "/hello",
        method: "POST",
        body: { name: "Homer" },
      },

      req: {
        path: "/hello",
      },

      set: jest.fn(),
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
      // eslint-disable-next-line no-empty-function
      set: () => {},
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

  it("adds default CORS headers if none are requested", async () => {
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
      request: {
        path: "/hello",
        method: "POST",
        body: { name: "Homer" },
      },

      req: {
        path: "/hello",
      },

      set: jest.fn(),
    };

    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
    expect(ctx.set).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,POST,DELETE,PATCH"
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      undefined
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Expose-Headers",
      undefined
    );
  });

  it("reflects desired CORS headers if specific headers are requested", async () => {
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
      request: {
        path: "/hello",
        method: "POST",
        body: { name: "Homer" },

        headers: {
          origin: "http://my.local.app:3000",
          "access-control-request-headers": "X-My-Header,X-Another-Header",
        },
      },

      req: {
        path: "/hello",
      },

      set: jest.fn(),
    };

    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "http://my.local.app:3000"
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,POST,DELETE,PATCH"
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "X-My-Header,X-Another-Header"
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Expose-Headers",
      "X-My-Header,X-Another-Header"
    );
  });
});
