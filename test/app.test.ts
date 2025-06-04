// import { describe, it, expect } from "@jest/globals";
import * as app from "../src/app";

// Use the same HttpMethods type as in app.ts
const httpMethod: any = "get";

// Minimal valid mock Config
const mockConfig = {
  openApiPath: "foo.yaml",
  basePath: ".",
  port: 1234,
  alwaysFakeOptionals: false,
  generate: { routes: false, types: false },
  proxyPaths: new Map(),
  proxyUrl: "",
  startRepl: false,
  startServer: false,
  watch: { routes: false, types: false },
  routePrefix: "",
};

// Minimal valid mock MockRequest
const mockRequest = {
  method: httpMethod,
  rawPath: "/foo",
  body: undefined,
  headers: {},
  path: "/foo",
  query: {},
  req: {},
};

class MockModuleLoader {
  private registry: any;
  constructor(basePath: string, registry: any, contextRegistry: any) {
    this.registry = registry;
  }
  async load() {
    // Register a mock route in the registry for GET /foo
    this.registry.add("/foo", {
      get: async () => ({ ok: true }),
    });
  }
  async watch() {}
  async stopWatching() {}
}

describe("handleMswRequest", () => {
  it("returns 404 if no handler exists", async () => {
    const result = await (app as any).handleMswRequest(mockRequest);
    expect(result).toEqual({
      error: "No handler found for get /foo",
      status: 404,
    });
  });

  it("calls the correct handler if present", async () => {
    await (app as any).createMswHandlers(
      {
        ...mockConfig,
        openApiPath: "openapi-example.yaml",
      },
      MockModuleLoader,
    );
    const result = await (app as any).handleMswRequest(mockRequest);
    expect(result).toBeDefined();
    expect(result.ok).toBe(true);
  });
});

describe("createMswHandlers", () => {
  it("throws if openApiDocument is undefined", async () => {
    await expect(
      (app as any).createMswHandlers(
        {
          ...mockConfig,
          openApiPath: "nonexistent.yaml",
        },
        MockModuleLoader,
      ),
    ).rejects.toThrow();
  });

  it("returns handlers for valid openApiDocument", async () => {
    const handlers = await (app as any).createMswHandlers(
      {
        ...mockConfig,
        openApiPath: "openapi-example.yaml",
      },
      MockModuleLoader,
    );
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);
    expect(handlers[0]).toHaveProperty("method");
    expect(handlers[0]).toHaveProperty("path");
  });
});
