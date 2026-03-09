import { adminApiMiddleware } from "../../src/server/admin-api-middleware.js";
import type { Config } from "../../src/server/config.js";
import { ContextRegistry } from "../../src/server/context-registry.js";
import { Registry } from "../../src/server/registry.js";

const createConfig = (): Config => ({
  alwaysFakeOptionals: false,
  basePath: "/test/path",
  buildCache: false,

  generate: {
    routes: true,
    types: true,
  },

  openApiPath: "/test/openapi.yaml",
  port: 3100,
  proxyPaths: new Map(),
  proxyUrl: "",
  routePrefix: "",
  startRepl: true,
  startServer: true,

  watch: {
    routes: true,
    types: true,
  },
});

interface MockContext {
  body?: unknown;
  method: string;
  request: {
    body?: unknown;
  };
  status?: number;
  URL: {
    pathname: string;
  };
}

const createMockContext = (
  method: string,
  pathname: string,
  body?: unknown,
): MockContext => ({
  body: undefined,
  method,

  request: {
    body,
  },

  status: undefined,

  URL: {
    pathname,
  },
});

describe("adminApiMiddleware", () => {
  let registry: Registry;
  let contextRegistry: ContextRegistry;
  let config: Config;

  beforeEach(() => {
    registry = new Registry();
    contextRegistry = new ContextRegistry();
    config = createConfig();
  });

  describe("Health Check", () => {
    it("returns server status on GET /_counterfact/api/health", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/_counterfact/api/health");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.body).toEqual({
        basePath: "/test/path",
        port: 3100,
        routePrefix: "",
        status: "ok",
        uptime: expect.any(Number),
      });
    });
  });

  describe("Context Listing", () => {
    it("lists all contexts on GET /_counterfact/api/contexts", async () => {
      contextRegistry.add("/", { rootData: "test" });
      contextRegistry.add("/pets", { pets: [] });
      contextRegistry.add("/users", { users: [] });

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/_counterfact/api/contexts");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.body).toEqual({
        data: {
          contexts: {
            "/": { rootData: "test" },
            "/pets": { pets: [] },
            "/users": { users: [] },
          },

          paths: ["/", "/pets", "/users"],
        },

        success: true,
      });
    });
  });

  describe("Context Retrieval", () => {
    it("returns specific context on GET /_counterfact/api/contexts/{path}", async () => {
      contextRegistry.add("/pets", { pets: [{ id: 1, name: "Fido" }] });

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/_counterfact/api/contexts/pets");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.body).toEqual({
        data: {
          context: { pets: [{ id: 1, name: "Fido" }] },
          path: "/pets",
        },

        success: true,
      });
    });

    it("returns hierarchical context for nested paths", async () => {
      contextRegistry.add("/", { rootData: "root" });
      contextRegistry.add("/api", { apiData: "api" });
      contextRegistry.add("/api/users", { users: [] });

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext(
        "GET",
        "/_counterfact/api/contexts/api/users/123",
      );
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      // Should return /api/users context (closest parent)
      expect(ctx.body).toEqual({
        data: {
          context: { users: [] },
          path: "/api/users/123",
        },

        success: true,
      });
    });
  });

  describe("Context Updates", () => {
    it("updates context on POST /_counterfact/api/contexts/{path}", async () => {
      contextRegistry.add("/pets", { pets: [] });

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const newData = {
        pets: [
          { id: 1, name: "Fido" },
          { id: 2, name: "Whiskers" },
        ],
      };

      const ctx = createMockContext(
        "POST",
        "/_counterfact/api/contexts/pets",
        newData,
      );

      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.body).toEqual({
        data: {
          context: newData,
          path: "/pets",
        },

        message: "Context updated for path: /pets",
        success: true,
      });

      // Verify context was actually updated
      const updatedContext = contextRegistry.find("/pets");

      expect(updatedContext.pets).toHaveLength(2);
    });

    it("returns 400 for invalid JSON body on context update", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("POST", "/_counterfact/api/contexts/pets");

      ctx.request.body = "invalid";

      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({
        error: "Request body must be a valid JSON object",
        success: false,
      });
    });

    it("preserves existing properties with smart diffing", async () => {
      contextRegistry.update("/data", {
        preserveMe: "original",
        updateMe: "old",
      });

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("POST", "/_counterfact/api/contexts/data", {
        updateMe: "new",
      });

      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      const updatedContext = contextRegistry.find("/data");

      expect(updatedContext.preserveMe).toBe("original");
      expect(updatedContext.updateMe).toBe("new");
    });
  });

  describe("Config Retrieval", () => {
    it("returns full config on GET /_counterfact/api/config", async () => {
      config.proxyPaths.set("/api", true);
      config.proxyUrl = "https://example.com";

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/_counterfact/api/config");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.body).toEqual({
        data: {
          alwaysFakeOptionals: false,
          basePath: "/test/path",
          buildCache: false,

          generate: {
            routes: true,
            types: true,
          },

          openApiPath: "/test/openapi.yaml",
          port: 3100,
          proxyPaths: [["/api", true]],
          proxyUrl: "https://example.com",
          routePrefix: "",
          startRepl: true,
          startServer: true,

          watch: {
            routes: true,
            types: true,
          },
        },

        success: true,
      });
    });
  });

  describe("Proxy Configuration", () => {
    it("returns proxy config on GET /_counterfact/api/config/proxy", async () => {
      config.proxyUrl = "https://api.example.com";
      config.proxyPaths.set("/users", true);
      config.proxyPaths.set("/posts", false);

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/_counterfact/api/config/proxy");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.body).toEqual({
        data: {
          proxyPaths: [
            ["/users", true],
            ["/posts", false],
          ],

          proxyUrl: "https://api.example.com",
        },

        success: true,
      });
    });

    it("updates proxy URL on PATCH /_counterfact/api/config/proxy", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("PATCH", "/_counterfact/api/config/proxy", {
        proxyUrl: "https://new-api.example.com",
      });

      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(config.proxyUrl).toBe("https://new-api.example.com");
      expect(ctx.body).toEqual({
        data: {
          proxyPaths: [],
          proxyUrl: "https://new-api.example.com",
        },

        message: "Proxy configuration updated",
        success: true,
      });
    });

    it("updates proxy paths on PATCH /_counterfact/api/config/proxy", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("PATCH", "/_counterfact/api/config/proxy", {
        proxyPaths: [
          ["/api/users", true],
          ["/api/products", false],
        ],
      });

      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(config.proxyPaths.get("/api/users")).toBe(true);
      expect(config.proxyPaths.get("/api/products")).toBe(false);
    });

    it("updates both proxy URL and paths together", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("PATCH", "/_counterfact/api/config/proxy", {
        proxyPaths: [["/api", true]],
        proxyUrl: "https://api.example.com",
      });

      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(config.proxyUrl).toBe("https://api.example.com");
      expect(config.proxyPaths.get("/api")).toBe(true);
    });

    it("returns 400 for invalid proxy config body", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("PATCH", "/_counterfact/api/config/proxy");

      ctx.request.body = "invalid";

      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toEqual({
        error: "Request body must be a valid JSON object",
        success: false,
      });
    });
  });

  describe("Routes Listing", () => {
    it("returns all routes on GET /_counterfact/api/routes", async () => {
      registry.add("/pets", {
        GET() {
          return { body: "pets", headers: {}, status: 200 };
        },

        POST() {
          return { body: "create pet", headers: {}, status: 201 };
        },
      });

      registry.add("/users", {
        GET() {
          return { body: "users", headers: {}, status: 200 };
        },
      });

      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/_counterfact/api/routes");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.body).toMatchObject({
        data: {
          routes: expect.arrayContaining([
            expect.objectContaining({
              methods: expect.objectContaining({
                GET: expect.any(String),
                POST: expect.any(String),
              }),
              path: "/pets",
            }),
            expect.objectContaining({
              methods: expect.objectContaining({
                GET: expect.any(String),
              }),
              path: "/users",
            }),
          ]),
        },

        success: true,
      });
    });
  });

  describe("Non-Admin Routes", () => {
    it("passes through to next middleware for non-admin routes", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/regular/api/path");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      // Non-admin routes should pass through (body not set by admin middleware)
      expect(ctx.body).toBeUndefined();
    });
  });

  describe("404 Handling", () => {
    it("returns 404 for unknown admin API endpoints", async () => {
      const middleware = adminApiMiddleware(registry, contextRegistry, config);
      const ctx = createMockContext("GET", "/_counterfact/api/unknown");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.status).toBe(404);
      expect(ctx.body).toEqual({
        error: "Not found",
        message: "Unknown admin API endpoint: /_counterfact/api/unknown",
        path: "/_counterfact/api/unknown",
        success: false,
      });
    });
  });

  describe("Error Handling", () => {
    it("returns 500 on internal errors", async () => {
      const brokenContextRegistry = {
        getAllContexts() {
          throw new Error("Database connection failed");
        },

        getAllPaths() {
          throw new Error("Database connection failed");
        },
      } as any;

      const middleware = adminApiMiddleware(
        registry,
        brokenContextRegistry,
        config,
      );

      const ctx = createMockContext("GET", "/_counterfact/api/contexts");
      const next = async () => {
        await Promise.resolve(undefined);
      };

      await middleware(ctx as any, next);

      expect(ctx.status).toBe(500);
      expect(ctx.body).toMatchObject({
        error: "Database connection failed",
        success: false,
      });
    });
  });
});
