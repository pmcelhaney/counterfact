/* eslint-disable @typescript-eslint/no-explicit-any */
// import { describe, it, expect } from "@jest/globals";
import { jest } from "@jest/globals";
import request from "supertest";
import { usingTemporaryFiles } from "using-temporary-files";

import * as app from "../src/app";
import { ApiRunner } from "../src/api-runner";
import { ContextRegistry } from "../src/server/context-registry";
import { ScenarioRegistry } from "../src/server/scenario-registry";

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
  prefix: "",
};

describe("counterfact", () => {
  it("returns a startRepl function", async () => {
    const result = await (app as any).counterfact(mockConfig);
    expect(typeof result.startRepl).toBe("function");
  });

  it("returns contextRegistry, registry, koaApp, and start", async () => {
    const result = await (app as any).counterfact(mockConfig);
    expect(result.contextRegistry).toBeDefined();
    expect(result.registry).toBeDefined();
    expect(result.koaApp).toBeDefined();
    expect(result.routesMiddleware).toBeUndefined();
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

  it("accepts a specs array and creates runners for each spec", async () => {
    const spy = jest.spyOn(ApiRunner, "create");

    const specs = [
      { source: "_", prefix: "/api/v1", group: "v1" },
      { source: "_", prefix: "/api/v2", group: "v2" },
    ];

    await (app as any).counterfact(mockConfig, specs);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ openApiPath: "_", prefix: "/api/v1" }),
      "v1",
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ openApiPath: "_", prefix: "/api/v2" }),
      "v2",
    );

    spy.mockRestore();
  });

  it("uses the first spec's runner as primary (contextRegistry, registry) when specs are provided", async () => {
    const realCreate = ApiRunner.create;
    const capturedRunners: ApiRunner[] = [];

    const createSpy = jest.spyOn(ApiRunner, "create");
    createSpy.mockImplementation(async (...args) => {
      const runner = await realCreate.apply(ApiRunner, args);
      capturedRunners.push(runner);
      return runner;
    });

    const specs = [
      { source: "_", prefix: "/api/v1", group: "v1" },
      { source: "_", prefix: "/api/v2", group: "v2" },
    ];

    const result = await (app as any).counterfact(mockConfig, specs);

    expect(capturedRunners).toHaveLength(2);
    expect(result.contextRegistry).toBe(capturedRunners[0]!.contextRegistry);
    expect(result.registry).toBe(capturedRunners[0]!.registry);

    createSpy.mockRestore();
  });

  it("routes requests to the correct runner based on prefix when specs are provided", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add(
        "v1/routes/hello.js",
        `export function GET() { return { body: "hello from v1" }; }`,
      );
      await $.add(
        "v2/routes/hello.js",
        `export function GET() { return { body: "hello from v2" }; }`,
      );

      const specs = [
        { source: "_", prefix: "/api/v1", group: "v1" },
        { source: "_", prefix: "/api/v2", group: "v2" },
      ];

      const { koaApp, start } = await (app as any).counterfact(
        { ...mockConfig, basePath: $.path(".") },
        specs,
      );

      const { stop } = await start({
        startServer: true,
        buildCache: false,
        generate: { routes: false, types: false },
        watch: { routes: false, types: false },
      });

      const v1Response = await request(koaApp.callback()).get("/api/v1/hello");
      const v2Response = await request(koaApp.callback()).get("/api/v2/hello");

      expect(v1Response.text).toContain("hello from v1");
      expect(v2Response.text).toContain("hello from v2");

      await stop();
    });
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
