import type { REPLServer } from "node:repl";

import { afterEach, jest } from "@jest/globals";

import { createCompleter, startRepl } from "../../src/repl/repl.js";
import type { CompleterCallback, ReplApiBinding } from "../../src/repl/repl.js";
import type { Config } from "../../src/server/config.js";
import { ContextRegistry } from "../../src/server/context-registry.js";
import { Registry } from "../../src/server/registry.js";
import { ScenarioRegistry } from "../../src/server/scenario-registry.js";

const CONFIG: Config = {
  basePath: "",

  generate: {
    routes: true,
    types: true,
  },

  openApiPath: "",
  port: 9999,
  proxyPaths: new Map([]),
  proxyUrl: "https://example.com/test",
  prefix: "",
  startAdminApi: false,
  startRepl: false,
  startServer: true,

  watch: {
    routes: true,
    types: true,
  },
};

type GroupedLoadContext = Record<
  string,
  (path: string) => Record<string, unknown>
>;
type RouteBuilderLike = {
  path: (arguments_: Record<string, unknown>) => unknown;
};

class MockRepl {
  public isBufferCleared = false;

  public isPromptDisplayed = false;

  public commandLog: string[] = [];

  public clearBufferedCommand() {
    this.commandLog.push("clearBufferedCommand");
  }

  public displayPrompt() {
    this.commandLog.push("displayPrompt");
  }
}

class ReplHarness {
  public server: REPLServer;

  private readonly mock = new MockRepl();

  public output: string[] = [];

  public constructor(
    contextRegistry: ContextRegistry,
    registry: Registry,
    config: Config,
    scenarioRegistry?: ScenarioRegistry,
    apiBindings?: ReplApiBinding[],
  ) {
    this.server = startRepl(
      contextRegistry,
      registry,
      config,
      (line) => this.output.push(line),
      undefined,
      scenarioRegistry,
      apiBindings,
    );
  }

  public call(name: string, options: string) {
    this.server.commands[name]?.action.call(this.mock, options);
  }

  public async callAsync(name: string, options: string): Promise<void> {
    await this.server.commands[name]?.action.call(this.mock, options);
  }

  public isReset() {
    return (
      this.mock.commandLog[0] === "clearBufferedCommand" &&
      this.mock.commandLog[1] === "displayPrompt"
    );
  }
}

function createHarness(
  scenarioRegistry?: ScenarioRegistry,
  apiBindings?: ReplApiBinding[],
) {
  const contextRegistry = new ContextRegistry();
  const registry = new Registry();
  const config = { ...CONFIG };

  config.proxyPaths = new Map();

  const harness = new ReplHarness(
    contextRegistry,
    registry,
    config,
    scenarioRegistry,
    apiBindings,
  );

  openServers.push(harness.server);

  return { config, contextRegistry, harness, registry };
}

const openServers: REPLServer[] = [];

afterEach(() => {
  for (const server of openServers) {
    server.close();
  }

  openServers.length = 0;
});

describe("REPL", () => {
  it("turns on the proxy globally", () => {
    const { config, harness } = createHarness();

    harness.call("proxy", "on");

    expect(config.proxyPaths.get("")).toBe(true);
    expect(harness.isReset()).toBe(true);
  });

  it("turns off the proxy globally", () => {
    const { config, harness } = createHarness();

    harness.call("proxy", "off");

    expect(config.proxyPaths.get("")).toBe(false);
    expect(harness.isReset()).toBe(true);
  });

  it("turns on the proxy for the root", () => {
    const { config, harness } = createHarness();

    harness.call("proxy", "on /");

    expect(config.proxyPaths.get("")).toBe(true);
    expect(harness.isReset()).toBe(true);
  });

  it("turns off the proxy for the root", () => {
    const { config, harness } = createHarness();

    harness.call("proxy", "off /");

    expect(config.proxyPaths.get("")).toBe(false);
    expect(harness.isReset()).toBe(true);
  });

  it("turns on the proxy for an endpoint", () => {
    const { config, harness } = createHarness();

    harness.call("proxy", "on /foo/bar");

    expect(config.proxyPaths.get("/foo/bar")).toBe(true);
    expect(harness.isReset()).toBe(true);
  });

  it("turns off the proxy for an endpoint", () => {
    const { config, harness } = createHarness();

    harness.call("proxy", "off /foo/bar");

    expect(config.proxyPaths.get("/foo/bar")).toBe(false);
    expect(harness.isReset()).toBe(true);
  });

  it("shows the proxy status", () => {
    const { config, harness } = createHarness();

    config.proxyPaths.set("/foo", true);
    config.proxyPaths.set("/foo/bar", false);

    harness.call("proxy", "status");

    expect(harness.output).toEqual([
      "Proxy Configuration:",
      "",
      "The proxy URL is https://example.com/test",
      "",
      "Paths prefixed with [+] will be proxied.",
      "Paths prefixed with [-] will not be proxied.",
      "",
      "[+] /foo/",
      "[-] /foo/bar/",
    ]);
    expect(harness.isReset()).toBe(true);
  });

  it("shows the proxy status when no URL is set", () => {
    const { config, harness } = createHarness();

    config.proxyUrl = "";
    config.proxyPaths.set("/foo", true);
    config.proxyPaths.set("/foo/bar", false);

    harness.call("proxy", "status");

    expect(harness.output).toEqual([
      "The proxy URL is not set.",
      'To set it, type ".proxy url <url>',
    ]);
    expect(harness.isReset()).toBe(true);
  });

  it("displays an explanatory message after turning the proxy on for an endpoint", () => {
    const { harness } = createHarness();

    harness.call("proxy", "on /foo/bar");

    expect(harness.output).toEqual([
      "Requests to /foo/bar will be proxied to https://example.com/test/foo/bar",
    ]);
  });

  it("displays an explanatory message after turning the proxy off for an endpoint", () => {
    const { harness } = createHarness();

    harness.call("proxy", "off /foo/bar");

    expect(harness.output).toEqual([
      "Requests to /foo/bar will be handled by local code",
    ]);
  });

  it.each(["", "help"])("displays a proxy help message (%s)", () => {
    const { harness } = createHarness();

    harness.call("proxy", "help");

    expect(harness.output).toEqual([
      ".proxy [on|off] - turn the proxy on/off at the root level",
      ".proxy [on|off] <path-prefix> - turn the proxy on for a path",
      ".proxy status - show the proxy status",
      ".proxy help - show this message",
    ]);
  });

  it("sets the proxy url", () => {
    const { config, harness } = createHarness();

    harness.call("proxy", "url https://example.com/new-url");

    expect(config.proxyUrl).toBe("https://example.com/new-url");
    expect(harness.output).toEqual([
      "proxy URL is set to https://example.com/new-url",
    ]);
    expect(harness.isReset()).toBe(true);
  });

  it("displays a message if 'proxy url' is entered without a URL", () => {
    const { harness } = createHarness();

    harness.call("proxy", "url");

    expect(harness.output).toEqual(["usage: .proxy url <url>"]);
    expect(harness.isReset()).toBe(true);
  });

  it("displays help information for the counterfact command", () => {
    const { harness } = createHarness();

    harness.call("counterfact", "");

    expect(harness.output).toEqual([
      "This is a read-eval-print loop (REPL), the same as the one you get when you run node with no arguments.",
      "Except that it's connected to the running server, which you can access with the following globals:",
      "",
      "- loadContext('/some/path'): to access the context object for a given path",
      "- context: the root context ( same as loadContext('/') )",
      "- route('/some/path'): create a request builder for the given path",
      "",
      "For more information, see https://counterfact.dev/docs/usage.html",
      "",
    ]);
    expect(harness.isReset()).toBe(true);
  });

  it("keeps single-runner context and route unqualified", () => {
    const { harness, contextRegistry } = createHarness();
    contextRegistry.add("/pets", { count: 2 });

    expect(typeof harness.server.context["loadContext"]).toBe("function");
    expect(typeof harness.server.context["route"]).toBe("function");
    expect(harness.server.context["context"]).toEqual({});
    expect(harness.server.context["routes"]).toEqual({});
    expect(
      (
        harness.server.context["loadContext"] as (
          path: string,
        ) => Record<string, unknown>
      )("/pets"),
    ).toMatchObject({ count: 2 });
    expect(
      (harness.server.context["route"] as (path: string) => RouteBuilderLike)(
        "/pets/{petId}",
      ).path({ petId: 1 }),
    ).toBeDefined();
  });

  it("exposes grouped context/route/routes for multi-runner mode", () => {
    const billingContextRegistry = new ContextRegistry();
    const inventoryContextRegistry = new ContextRegistry();
    const billingRegistry = new Registry();
    const inventoryRegistry = new Registry();
    const scenarioRegistry = new ScenarioRegistry();

    billingContextRegistry.add("/", {
      billingOnly: true,
    });
    inventoryContextRegistry.add("/", {
      inventoryOnly: true,
    });
    scenarioRegistry.add("index", {});

    const { harness } = createHarness(undefined, [
      {
        contextRegistry: billingContextRegistry,
        group: "billing",
        registry: billingRegistry,
        scenarioRegistry,
      },
      {
        contextRegistry: inventoryContextRegistry,
        group: "inventory",
        registry: inventoryRegistry,
      },
    ]);

    expect(typeof harness.server.context["loadContext"]).toBe("object");
    expect(typeof harness.server.context["route"]).toBe("object");
    expect(harness.server.context["context"]).toMatchObject({
      billing: { billingOnly: true },
      inventory: { inventoryOnly: true },
    });
    expect(harness.server.context["routes"]).toEqual({
      billing: {},
      inventory: {},
    });
    expect(
      (harness.server.context["loadContext"] as GroupedLoadContext)[
        "inventory"
      ]?.("/"),
    ).toMatchObject({ inventoryOnly: true });
  });

  it("uses deterministic keys when groups are empty or duplicated", () => {
    const emptyGroupContextRegistry = new ContextRegistry();
    const firstBillingContextRegistry = new ContextRegistry();
    const secondBillingContextRegistry = new ContextRegistry();

    emptyGroupContextRegistry.add("/", { name: "empty" });
    firstBillingContextRegistry.add("/", { name: "billing-first" });
    secondBillingContextRegistry.add("/", { name: "billing-second" });

    const { harness } = createHarness(undefined, [
      {
        contextRegistry: emptyGroupContextRegistry,
        group: "",
        registry: new Registry(),
      },
      {
        contextRegistry: firstBillingContextRegistry,
        group: "billing",
        registry: new Registry(),
      },
      {
        contextRegistry: secondBillingContextRegistry,
        group: "billing",
        registry: new Registry(),
      },
    ]);

    expect(harness.server.context["context"]).toMatchObject({
      api1: { name: "empty" },
      billing: { name: "billing-first" },
      billing_2: { name: "billing-second" },
    });
    expect(harness.server.context["routes"]).toEqual({
      api1: {},
      billing: {},
      billing_2: {},
    });
  });

  describe(".scenario command", () => {
    it("calls the named export from scenarios/index for a single-segment path", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("index", {
        foo(ctx: { context: Record<string, unknown> }) {
          ctx.context["applied"] = "foo";
        },
      });

      const { harness, contextRegistry } = createHarness(scenarioRegistry);

      await harness.callAsync("scenario", "foo");

      expect(harness.output).toContain("Applied foo");
      expect(contextRegistry.find("/")).toMatchObject({ applied: "foo" });
      expect(harness.isReset()).toBe(true);
    });

    it("calls the named export from scenarios/<name> for a two-segment path", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("myscript", {
        bar(ctx: { context: Record<string, unknown> }) {
          ctx.context["applied"] = "bar";
        },
      });

      const { harness, contextRegistry } = createHarness(scenarioRegistry);

      await harness.callAsync("scenario", "myscript/bar");

      expect(harness.output).toContain("Applied myscript/bar");
      expect(contextRegistry.find("/")).toMatchObject({ applied: "bar" });
    });

    it("calls the named export from scenarios/<dir>/<name> for a three-segment path", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("foo/bar", {
        baz(ctx: { context: Record<string, unknown> }) {
          ctx.context["applied"] = "baz";
        },
      });

      const { harness, contextRegistry } = createHarness(scenarioRegistry);

      await harness.callAsync("scenario", "foo/bar/baz");

      expect(harness.output).toContain("Applied foo/bar/baz");
      expect(contextRegistry.find("/")).toMatchObject({ applied: "baz" });
    });

    it("passes routes and route to the function", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("index", {
        setup(ctx: { routes: Record<string, unknown> }) {
          ctx.routes["myRoute"] = { path: "/pets" };
        },
      });

      const { harness } = createHarness(scenarioRegistry);

      await harness.callAsync("scenario", "setup");

      expect(harness.output).toContain("Applied setup");
      expect(
        (harness.server.context["routes"] as Record<string, unknown>)[
          "myRoute"
        ],
      ).toMatchObject({ path: "/pets" });
    });

    it("shows an error when the scenario file is not in the registry", async () => {
      const scenarioRegistry = new ScenarioRegistry();
      const { harness } = createHarness(scenarioRegistry);

      await harness.callAsync("scenario", "nonexistent");

      expect(harness.output[0]).toMatch(/Error: Could not find/u);
      expect(harness.isReset()).toBe(true);
    });

    it("shows an error when the named export is not a function", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("index", {
        notAFunction: "I am a string",
      });

      const { harness } = createHarness(scenarioRegistry);

      await harness.callAsync("scenario", "notAFunction");

      expect(harness.output[0]).toMatch(
        /Error: "notAFunction" is not a function/u,
      );
      expect(harness.isReset()).toBe(true);
    });

    it("shows a usage message when called with no argument", async () => {
      const { harness } = createHarness();

      await harness.callAsync("scenario", "");

      expect(harness.output).toContain("usage: .scenario <path>");
      expect(harness.isReset()).toBe(true);
    });

    it("rejects path traversal using '..' segments", async () => {
      const { harness } = createHarness();

      await harness.callAsync("scenario", "../secret/foo");

      expect(harness.output[0]).toMatch(/Error: Path must not contain/u);
      expect(harness.isReset()).toBe(true);
    });
  });

  describe("route autocomplete", () => {
    function callCompleter(
      completer: ReturnType<typeof createCompleter>,
      line: string,
    ): Promise<[string[], string]> {
      return new Promise((resolve, reject) => {
        completer(line, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    it('returns matching routes when typing client.get("', async () => {
      const registry = new Registry();

      registry.add("/pets", { GET() {} });
      registry.add("/pets/{petId}", { GET() {} });
      registry.add("/users", { GET() {} });

      const completer = createCompleter(registry);
      const [completions, prefix] = await callCompleter(
        completer,
        'client.get("/p',
      );

      expect(prefix).toBe("/p");
      expect(completions).toEqual(["/pets", "/pets/{petId}"]);
    });

    it("returns all routes when no partial is provided", async () => {
      const registry = new Registry();

      registry.add("/pets", { GET() {} });
      registry.add("/users", { GET() {} });

      const completer = createCompleter(registry);
      const [completions, prefix] = await callCompleter(
        completer,
        'client.post("',
      );

      expect(prefix).toBe("");
      expect(completions).toEqual(["/pets", "/users"]);
    });

    it("returns empty completions for non-matching input when no fallback is set", async () => {
      const registry = new Registry();

      registry.add("/pets", { GET() {} });

      const completer = createCompleter(registry);
      const [completions, prefix] = await callCompleter(
        completer,
        "someOtherExpression",
      );

      expect(completions).toEqual([]);
      expect(prefix).toBe("someOtherExpression");
    });

    it("calls fallback completer for non-matching input", async () => {
      const registry = new Registry();

      registry.add("/pets", { GET() {} });

      const fallback = jest.fn((_line: string, callback: CompleterCallback) => {
        callback(null, [["context", "client"], "c"]);
      });

      const completer = createCompleter(registry, fallback);
      const [completions, prefix] = await callCompleter(completer, "c");

      expect(fallback).toHaveBeenCalledWith("c", expect.any(Function));
      expect(completions).toEqual(["context", "client"]);
      expect(prefix).toBe("c");
    });

    it.each(["get", "post", "put", "patch", "delete"])(
      "works for client.%s(...)",
      async (method) => {
        const registry = new Registry();

        registry.add("/pets", {
          GET() {},
          POST() {},
          PUT() {},
          PATCH() {},
          DELETE() {},
        });

        const completer = createCompleter(registry);
        const [completions] = await callCompleter(
          completer,
          `client.${method}("/pets`,
        );

        expect(completions).toEqual(["/pets"]);
      },
    );

    it('returns matching routes when typing route("', async () => {
      const registry = new Registry();

      registry.add("/pets", { GET() {} });
      registry.add("/pets/{petId}", { GET() {} });
      registry.add("/users", { GET() {} });

      const completer = createCompleter(registry);
      const [completions, prefix] = await callCompleter(completer, 'route("/p');

      expect(prefix).toBe("/p");
      expect(completions).toEqual(["/pets", "/pets/{petId}"]);
    });

    it('returns all routes when typing route(" with no partial', async () => {
      const registry = new Registry();

      registry.add("/pets", { GET() {} });
      registry.add("/users", { GET() {} });

      const completer = createCompleter(registry);
      const [completions, prefix] = await callCompleter(completer, 'route("');

      expect(prefix).toBe("");
      expect(completions).toEqual(["/pets", "/users"]);
    });

    it('suggests all RouteBuilder methods after route("/path").', async () => {
      const registry = new Registry();
      const completer = createCompleter(registry);

      const [completions, prefix] = await callCompleter(
        completer,
        'route("/pets").',
      );

      expect(prefix).toBe("");
      expect(completions).toEqual([
        "body(",
        "headers(",
        "help(",
        "method(",
        "missing(",
        "path(",
        "query(",
        "ready(",
        "send(",
      ]);
    });

    it('filters RouteBuilder methods based on typed prefix after route("/path").', async () => {
      const registry = new Registry();
      const completer = createCompleter(registry);

      const [completions, prefix] = await callCompleter(
        completer,
        'route("/pets").me',
      );

      expect(prefix).toBe("me");
      expect(completions).toEqual(["method("]);
    });

    it('suggests RouteBuilder methods after a chained call like route("/path").method("get").', async () => {
      const registry = new Registry();
      const completer = createCompleter(registry);

      const [completions, prefix] = await callCompleter(
        completer,
        'route("/pets").method("get").',
      );

      expect(prefix).toBe("");
      expect(completions).toEqual([
        "body(",
        "headers(",
        "help(",
        "method(",
        "missing(",
        "path(",
        "query(",
        "ready(",
        "send(",
      ]);
    });
  });

  describe(".scenario tab completion", () => {
    function callCompleter(
      completer: ReturnType<typeof createCompleter>,
      line: string,
    ): Promise<[string[], string]> {
      return new Promise((resolve, reject) => {
        completer(line, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }

    it("returns function names from the index key when no slash in partial", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("index", {
        soldPets() {},
        resetAll() {},
        notAScenario: 42,
      });

      const registry = new Registry();
      const completer = createCompleter(registry, undefined, scenarioRegistry);

      // Partial "sold" — should match soldPets only, not the non-function export
      const [completions, prefix] = await callCompleter(
        completer,
        ".scenario sold",
      );

      expect(prefix).toBe("sold");
      expect(completions).toEqual(["soldPets"]);
      expect(completions).not.toContain("resetAll");

      // Partial "reset" — should match resetAll only
      const [completions2] = await callCompleter(completer, ".scenario reset");

      expect(completions2).toEqual(["resetAll"]);

      // Non-function exports should not be suggested
      const [completions3] = await callCompleter(completer, ".scenario not");

      expect(completions3).toEqual([]);
    });

    it("returns all function names and file prefixes when partial is empty", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("index", { foo() {}, bar() {} });
      scenarioRegistry.add("myscript", { baz() {} });

      const registry = new Registry();
      const completer = createCompleter(registry, undefined, scenarioRegistry);
      const [completions, prefix] = await callCompleter(
        completer,
        ".scenario ",
      );

      expect(prefix).toBe("");
      expect(completions).toContain("foo");
      expect(completions).toContain("bar");
      expect(completions).toContain("myscript/");
    });

    it("returns exports from the named file key when partial contains a slash", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("myscript", { soldPets() {}, resetAll() {} });

      const registry = new Registry();
      const completer = createCompleter(registry, undefined, scenarioRegistry);
      const [completions, prefix] = await callCompleter(
        completer,
        ".scenario myscript/sol",
      );

      expect(prefix).toBe("myscript/sol");
      expect(completions).toEqual(["myscript/soldPets"]);
    });

    it("returns all exports from the named file key when only the slash is typed", async () => {
      const scenarioRegistry = new ScenarioRegistry();

      scenarioRegistry.add("pets", { sold() {}, reset() {} });

      const registry = new Registry();
      const completer = createCompleter(registry, undefined, scenarioRegistry);
      const [completions, prefix] = await callCompleter(
        completer,
        ".scenario pets/",
      );

      expect(prefix).toBe("pets/");
      expect(completions).toEqual(["pets/sold", "pets/reset"]);
    });

    it("returns empty completions when scenarioRegistry is not provided", async () => {
      const registry = new Registry();
      const completer = createCompleter(registry);
      const [completions] = await callCompleter(completer, ".scenario sold");

      expect(completions).toEqual([]);
    });
  });
});
