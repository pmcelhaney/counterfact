import type { REPLServer } from "node:repl";

import { jest } from "@jest/globals";
import { usingTemporaryFiles } from "using-temporary-files";

import { createCompleter, startRepl } from "../../src/repl/repl.js";
import type { CompleterCallback } from "../../src/repl/repl.js";
import type { Config } from "../../src/server/config.js";
import { ContextRegistry } from "../../src/server/context-registry.js";
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
  proxyUrl: "https://example.com/test",
  routePrefix: "",
  startAdminApi: false,
  startRepl: false,
  startServer: true,

  watch: {
    routes: true,
    types: true,
  },
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
  ) {
    this.server = startRepl(contextRegistry, registry, config, (line) =>
      this.output.push(line),
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

function createHarness() {
  const contextRegistry = new ContextRegistry();
  const registry = new Registry();
  const config = { ...CONFIG };

  config.proxyPaths = new Map();

  const harness = new ReplHarness(contextRegistry, registry, config);

  return { config, contextRegistry, harness, registry };
}

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

  describe(".apply command", () => {
    it("calls the named export from scenarios/index for a single-segment path", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "scenarios/index.js",
          `export function foo($) { $.context.applied = "foo"; }`,
        );
        await $.add("scenarios/package.json", '{ "type": "module" }');

        const contextRegistry = new ContextRegistry();
        const registry = new Registry();
        const config = { ...CONFIG, basePath: $.path("") };
        const harness = new ReplHarness(contextRegistry, registry, config);

        await harness.callAsync("apply", "foo");

        expect(harness.output).toContain("Applied foo");
        expect(contextRegistry.find("/")).toMatchObject({ applied: "foo" });
        expect(harness.isReset()).toBe(true);
      });
    });

    it("calls the named export from scenarios/<name> for a two-segment path", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "scenarios/myscript.js",
          `export function bar($) { $.context.applied = "bar"; }`,
        );
        await $.add("scenarios/package.json", '{ "type": "module" }');

        const contextRegistry = new ContextRegistry();
        const registry = new Registry();
        const config = { ...CONFIG, basePath: $.path("") };
        const harness = new ReplHarness(contextRegistry, registry, config);

        await harness.callAsync("apply", "myscript/bar");

        expect(harness.output).toContain("Applied myscript/bar");
        expect(contextRegistry.find("/")).toMatchObject({ applied: "bar" });
      });
    });

    it("calls the named export from scenarios/<dir>/<name> for a three-segment path", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "scenarios/foo/bar.js",
          `export function baz($) { $.context.applied = "baz"; }`,
        );
        await $.add("scenarios/foo/package.json", '{ "type": "module" }');

        const contextRegistry = new ContextRegistry();
        const registry = new Registry();
        const config = { ...CONFIG, basePath: $.path("") };
        const harness = new ReplHarness(contextRegistry, registry, config);

        await harness.callAsync("apply", "foo/bar/baz");

        expect(harness.output).toContain("Applied foo/bar/baz");
        expect(contextRegistry.find("/")).toMatchObject({ applied: "baz" });
      });
    });

    it("passes routes and route to the function", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "scenarios/index.js",
          `export function setup($) { $.routes.myRoute = { path: "/pets" }; }`,
        );
        await $.add("scenarios/package.json", '{ "type": "module" }');

        const contextRegistry = new ContextRegistry();
        const registry = new Registry();
        const config = { ...CONFIG, basePath: $.path("") };
        const harness = new ReplHarness(contextRegistry, registry, config);

        await harness.callAsync("apply", "setup");

        expect(harness.output).toContain("Applied setup");
        expect(
          (harness.server.context["routes"] as Record<string, unknown>)[
            "myRoute"
          ],
        ).toMatchObject({ path: "/pets" });
      });
    });

    it("shows an error when the file cannot be found", async () => {
      await usingTemporaryFiles(async ($) => {
        const contextRegistry = new ContextRegistry();
        const registry = new Registry();
        const config = { ...CONFIG, basePath: $.path("") };
        const harness = new ReplHarness(contextRegistry, registry, config);

        await harness.callAsync("apply", "nonexistent");

        expect(harness.output[0]).toMatch(/Error: Could not find/u);
        expect(harness.isReset()).toBe(true);
      });
    });

    it("shows an error when the named export is not a function", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add(
          "scenarios/index.js",
          `export const notAFunction = "I am a string";`,
        );
        await $.add("scenarios/package.json", '{ "type": "module" }');

        const contextRegistry = new ContextRegistry();
        const registry = new Registry();
        const config = { ...CONFIG, basePath: $.path("") };
        const harness = new ReplHarness(contextRegistry, registry, config);

        await harness.callAsync("apply", "notAFunction");

        expect(harness.output[0]).toMatch(
          /Error: "notAFunction" is not a function/u,
        );
        expect(harness.isReset()).toBe(true);
      });
    });

    it("shows a usage message when called with no argument", async () => {
      const { harness } = createHarness();

      await harness.callAsync("apply", "");

      expect(harness.output).toContain("usage: .apply <path>");
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
});
