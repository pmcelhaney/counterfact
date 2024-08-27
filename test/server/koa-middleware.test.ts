import { jest } from "@jest/globals";
import type { ParameterizedContext } from "koa";
import type { IBaseKoaProxiesOptions } from "koa-proxies";

import type { Config } from "../../src/server/config.js";
import { ContextRegistry } from "../../src/server/context-registry.js";
import { Dispatcher } from "../../src/server/dispatcher.js";
import { koaMiddleware } from "../../src/server/koa-middleware.js";
import { Registry } from "../../src/server/registry.js";

const CONFIG: Config = {
  basePath: "",

  generate: {
    routes: true,
    types: true,
  },

  openApiPath: "",
  port: 9999,
  proxyPaths: new Map([]),
  proxyUrl: "",
  routePrefix: "",
  startRepl: false,
  startServer: true,

  watch: {
    routes: true,
    types: true,
  },
};

const mockKoaProxy = (path: string, { target }: IBaseKoaProxiesOptions) =>
  function proxy(context: { mockProxyTarget: string }) {
    context.mockProxyTarget = target;
  };

describe("koa middleware", () => {
  it("passes the request to the dispatcher and returns the response", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      // @ts-expect-error - not obvious how to make TS happy here, and it's just a unit test
      POST({ body }: { body: { name: string } }) {
        return {
          body: `Hello, ${body.name}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher, CONFIG);

    const ctx = {
      req: {
        path: "/hello",
      },

      request: {
        body: { name: "Homer" },
        headers: {},
        method: "POST",
        path: "/hello",
      },

      set: jest.fn(),
    } as unknown as ParameterizedContext;

    await middleware(ctx, async () => {
      await Promise.resolve(undefined);
    });

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
    const middleware = koaMiddleware(dispatcher, CONFIG);
    const ctx = {
      request: { headers: {}, method: "GET", path: "/not-modified" },

      set: () => undefined,
      status: undefined,
    };

    // @ts-expect-error - not obvious how to make TS happy here, and it's just a unit test
    await middleware(ctx, async () => {
      await Promise.resolve(undefined);
    });

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
      {
        ...CONFIG,
        proxyPaths: new Map([["", true]]),
        proxyUrl: "https://example.com",
      },

      // @ts-expect-error - not worried about matching the type exactly for a mock
      mockKoaProxy,
    );
    const ctx = {
      mockProxyTarget: "not-set",
      request: { headers: {}, method: "GET", path: "/proxy" },

      set() {
        /* set a header */
      },
    };

    // @ts-expect-error - not obvious how to make TS happy here, and it's just a unit test
    await middleware(ctx, async () => {
      await Promise.resolve(undefined);
    });

    expect(ctx.mockProxyTarget).toBe("https://example.com");
  });

  it("adds default CORS headers if none are requested", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      POST({ body }) {
        return {
          body: `Hello, ${(body as { name: string }).name}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher, CONFIG);
    const ctx = {
      body: undefined,

      req: {
        path: "/hello",
      },

      request: {
        body: { name: "Homer" },
        headers: {},
        method: "POST",
        path: "/hello",
      },

      set: jest.fn(),

      status: undefined,
    };

    // @ts-expect-error - not obvious how to make TS happy here, and it's just a unit test
    await middleware(ctx, async () => {
      await Promise.resolve(undefined);
    });

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
    expect(ctx.set).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    expect(ctx.set).toHaveBeenCalledWith(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,POST,DELETE,PATCH",
    );
    expect(ctx.set).toHaveBeenCalledWith("Access-Control-Allow-Headers", []);
    expect(ctx.set).toHaveBeenCalledWith("Access-Control-Expose-Headers", []);
  });

  it("reflects desired CORS headers if specific headers are requested", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      POST({ body }) {
        return {
          body: `Hello, ${(body as { name: string }).name}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher, CONFIG);
    const ctx = {
      body: undefined,

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
      status: undefined,
    };

    // @ts-expect-error - not obvious how to make TS happy here, and it's just a unit test
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

  it("adds custom response builder headers", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      POST({ body }) {
        return {
          body: `Hello, ${(body as { name: string }).name}!`,

          headers: {
            "X-Custom-Header": "custom value",
          },
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher, CONFIG);
    const ctx = {
      body: undefined,

      req: {
        path: "/hello",
      },

      request: {
        body: { name: "Homer" },
        headers: {},
        method: "POST",
        path: "/hello",
      },

      set: jest.fn(),

      status: undefined,
    };

    // @ts-expect-error - not obvious how to make TS happy here, and it's just a unit test
    await middleware(ctx, async () => {
      await Promise.resolve(undefined);
    });

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");

    expect(ctx.set).toHaveBeenCalledWith("X-Custom-Header", "custom value");
  });

  it("passes the request to the dispatcher and returns the response", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      // @ts-expect-error - not obvious how to make TS happy here, and it's just a unit test
      POST({ body }: { body: { name: string } }) {
        return {
          body: `Hello, ${body.name}!`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher, {
      ...CONFIG,
      routePrefix: "/api/v1",
    });

    const ctx = {
      req: {
        path: "/api/v1/hello",
      },

      request: {
        body: { name: "Homer" },
        headers: {},
        method: "POST",
        path: "/api/v1/hello",
      },

      set: jest.fn(),
    } as unknown as ParameterizedContext;

    await middleware(ctx, async () => {
      await Promise.resolve(undefined);
    });

    expect(ctx.status).toBe(200);
    expect(ctx.body).toBe("Hello, Homer!");
  });

  it("collects basic authorization headers", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      GET({ auth }: { auth?: { password?: string; username?: string } }) {
        return {
          body: `${auth?.username ?? ""} / ${auth?.password ?? ""}`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());
    const middleware = koaMiddleware(dispatcher, CONFIG);

    const ctx = {
      req: {
        path: "/hello",
      },

      request: {
        body: { name: "Homer" },

        headers: {
          authorization: `Basic ${btoa("user:secret")}`,
        },

        method: "GET",
        path: "/hello",
      },

      set: jest.fn(),
    } as unknown as ParameterizedContext;

    await middleware(ctx, async () => {
      await Promise.resolve(undefined);
    });

    expect(ctx.body).toEqual("user / secret");
  });
});
