import type { REPLServer } from "node:repl";

import { startRepl } from "../../src/repl/repl.js";
import type { Config } from "../../src/server/config.js";
import { ContextRegistry } from "../../src/server/context-registry.js";

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

  public constructor(contextRegistry: ContextRegistry, config: Config) {
    this.server = startRepl(contextRegistry, config, (line) =>
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
  const config = { ...CONFIG };

  config.proxyPaths = new Map();

  const harness = new ReplHarness(contextRegistry, config);

  return { config, contextRegistry, harness };
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
});
