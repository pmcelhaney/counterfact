import repl from "node:repl";

import type { Config } from "../server/config.js";
import type { ContextRegistry } from "../server/context-registry.js";

export function startRepl(contextRegistry: ContextRegistry, config: Config) {
  const replServer = repl.start("🤖> ");

  replServer.defineCommand("counterfact", {
    action() {
      process.stdout.write(
        "This is a read-eval-print loop (REPL), the same as the one you get when you run node with no arguments.\n",
      );
      process.stdout.write(
        "Except that it's connected to the running server, which you can access with the following globals:\n\n",
      );
      process.stdout.write(
        "- loadContext('/some/path'): to access the context object for a given path\n",
      );
      process.stdout.write(
        "- context: the root context ( same as loadContext('/') )\n",
      );
      process.stdout.write(
        "\nFor more information, see https://counterfact.dev/docs/usage.html\n\n",
      );

      this.clearBufferedCommand();
      this.displayPrompt();
    },

    help: "Get help with Counterfact",
  });

  replServer.defineCommand("proxy", {
    action(state) {
      if (state === "on") {
        config.proxyEnabled = true;
      }

      if (state === "off") {
        config.proxyEnabled = false;
      }

      process.stdout.write(
        `Proxy is ${config.proxyEnabled ? "on" : "off"}: ${config.proxyUrl}\n`,
      );

      this.clearBufferedCommand();
      this.displayPrompt();
    },

    help: "proxy [on|off] - turn the proxy on or off; proxy - print proxy info",
  });

  replServer.context.loadContext = (path: string) => contextRegistry.find(path);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  replServer.context.context = replServer.context.loadContext("/");

  return replServer;
}
