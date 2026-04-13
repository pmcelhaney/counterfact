/* eslint-disable @typescript-eslint/no-explicit-any */
// import { describe, it, expect } from "@jest/globals";
import * as app from "../src/app";
import { ContextRegistry } from "../src/server/context-registry";
import { Registry } from "../src/server/registry";
import { ScenarioRegistry } from "../src/server/scenario-registry";

// Use the same HttpMethods type as in app.ts
const httpMethod = "get";

// Minimal valid mock Config
const mockConfig = {
  openApiPath: "_",
  basePath: ".",
  port: 1234,
  alwaysFakeOptionals: false,
  generate: { routes: false, types: false },
  proxyPaths: new Map(),
  proxyUrl: "",
  startAdminApi: false,
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
  constructor(basePath: string, registry: Registry) {
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
        openApiPath: "test/fixtures/openapi-example.yaml",
      },
      MockModuleLoader,
    );
    const result = await (app as any).handleMswRequest(mockRequest);
    expect(result).toBeDefined();
    expect(result.ok).toBe(true);
  });
});

describe("counterfact", () => {
  it("returns a startRepl function", async () => {
    const result = await (app as any).counterfact(mockConfig);
    expect(typeof result.startRepl).toBe("function");
  });

  it("returns contextRegistry, registry, koaApp, koaMiddleware, and start", async () => {
    const result = await (app as any).counterfact(mockConfig);
    expect(result.contextRegistry).toBeDefined();
    expect(result.registry).toBeDefined();
    expect(result.koaApp).toBeDefined();
    expect(result.koaMiddleware).toBeDefined();
    expect(typeof result.start).toBe("function");
  });

  it("does not start the REPL automatically", async () => {
    // If start() still auto-started the REPL, it would call repl.start() which binds
    // to stdin; testing the `startRepl` property being a separate callable is the
    // architectural contract. We also verify start() returns a stop() function (not
    // a replServer), confirming the REPL is no longer embedded in the return value.
    const { start, startRepl } = await (app as any).counterfact({
      ...mockConfig,
      startRepl: true,
    });
    const result = await start({ ...mockConfig, startRepl: true });
    expect(typeof startRepl).toBe("function");
    expect(typeof result.stop).toBe("function");
    expect((result as any).replServer).toBeUndefined();
    await result.stop();
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
        openApiPath: "test/fixtures/openapi-example.yaml",
      },
      MockModuleLoader,
    );
    expect(Array.isArray(handlers)).toBe(true);
    expect(handlers.length).toBeGreaterThan(0);
    expect(handlers[0]).toHaveProperty("method");
    expect(handlers[0]).toHaveProperty("path");
  });
});

describe("runStartupScenario", () => {
  it("calls startup from the index module if it exists", async () => {
    const scenarioRegistry = new ScenarioRegistry();
    const contextRegistry = new ContextRegistry();
    let startupCalled = false;

    scenarioRegistry.add("index", {
      startup: () => {
        startupCalled = true;
      },
    });

    await (app as any).runStartupScenario(
      scenarioRegistry,
      contextRegistry,
      mockConfig,
    );

    expect(startupCalled).toBe(true);
  });

  it("passes the applyContext ($) to startup", async () => {
    const scenarioRegistry = new ScenarioRegistry();
    const contextRegistry = new ContextRegistry();
    let receivedContext: any;

    scenarioRegistry.add("index", {
      startup: ($: any) => {
        receivedContext = $;
      },
    });

    await (app as any).runStartupScenario(
      scenarioRegistry,
      contextRegistry,
      mockConfig,
    );

    expect(receivedContext).toBeDefined();
    expect(typeof receivedContext.context).toBe("object");
    expect(typeof receivedContext.loadContext).toBe("function");
    expect(typeof receivedContext.route).toBe("function");
    expect(typeof receivedContext.routes).toBe("object");
  });

  it("does nothing if there is no index module", async () => {
    const scenarioRegistry = new ScenarioRegistry();
    const contextRegistry = new ContextRegistry();

    await expect(
      (app as any).runStartupScenario(
        scenarioRegistry,
        contextRegistry,
        mockConfig,
      ),
    ).resolves.toBeUndefined();
  });

  it("does nothing if startup is not a function in the index module", async () => {
    const scenarioRegistry = new ScenarioRegistry();
    const contextRegistry = new ContextRegistry();

    scenarioRegistry.add("index", {
      startup: 42,
    });

    await expect(
      (app as any).runStartupScenario(
        scenarioRegistry,
        contextRegistry,
        mockConfig,
      ),
    ).resolves.toBeUndefined();
  });

  it("awaits an async startup function", async () => {
    const scenarioRegistry = new ScenarioRegistry();
    const contextRegistry = new ContextRegistry();
    let resolved = false;

    scenarioRegistry.add("index", {
      startup: async () => {
        await Promise.resolve();
        resolved = true;
      },
    });

    await (app as any).runStartupScenario(
      scenarioRegistry,
      contextRegistry,
      mockConfig,
    );

    expect(resolved).toBe(true);
  });
});
