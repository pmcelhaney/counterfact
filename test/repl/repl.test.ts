import type { REPLServer } from "node:repl";

import { jest } from "@jest/globals";

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
  });
});
