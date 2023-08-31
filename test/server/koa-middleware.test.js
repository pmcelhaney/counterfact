// eslint-disable-next-line import/no-extraneous-dependencies, n/no-extraneous-import, @typescript-eslint/no-shadow, no-shadow
import { jest } from "@jest/globals";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { Dispatcher } from "../../src/server/dispatcher.js";
import { koaMiddleware } from "../../src/server/koa-middleware.js";
import { Registry } from "../../src/server/registry.js";

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
      req: {
        path: "/hello",
      },

      request: {
        body: { name: "Homer" },
        method: "POST",
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
      request: { method: "GET", path: "/not-modified" },
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
      { proxyEnabled: true, proxyUrl: "https://example.com" },
      mockKoaProxy,
    );
    const ctx = {
      request: { method: "GET", path: "/proxy" },
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
      req: {
        path: "/hello",
      },

      request: {
        body: { name: "Homer" },
        method: "POST",
        path: "/hello",
      },

      set: jest.fn(),
    };

    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
    // eslint-disable-next-line sonar/cors
    expect(ctx.set).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,POST,DELETE,PATCH",
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      undefined,
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Expose-Headers",
      undefined,
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
      req: {
        path: "/hello",
      },

      request: {
        body: { name: "Homer" },

        headers: {
          "access-control-request-headers": "X-My-Header,X-Another-Header",
          origin: "https://my.local.app:3000",
        },

        method: "POST",

        path: "/hello",
      },

      set: jest.fn(),
    };

    await middleware(ctx);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "https://my.local.app:3000",
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,POST,DELETE,PATCH",
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Headers",
      "X-My-Header,X-Another-Header",
    );
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Expose-Headers",
      "X-My-Header,X-Another-Header",
    );
  });
});
