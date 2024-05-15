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
  proxyUrl: "",
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

  public constructor(server: REPLServer) {
    this.server = server;
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

describe("REPL", () => {
  it("turns on the proxy globally", () => {
    const contextRegistry = new ContextRegistry();
    const config = { ...CONFIG };

    const repl = startRepl(contextRegistry, config);

    const harness = new ReplHarness(repl);

    harness.call("proxy", "on");

    expect(config.proxyPaths.get("")).toBe(true);
    expect(harness.isReset()).toBe(true);
  });

  it("turns off the proxy globally", () => {
    const contextRegistry = new ContextRegistry();
    const config = { ...CONFIG };

    const repl = startRepl(contextRegistry, config);

    const harness = new ReplHarness(repl);

    harness.call("proxy", "off");

    expect(config.proxyPaths.get("")).toBe(false);
    expect(harness.isReset()).toBe(true);
  });
});
