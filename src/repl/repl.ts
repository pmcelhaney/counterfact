import repl from "node:repl";

import type { Config } from "../server/config.js";
import type { ContextRegistry } from "../server/context-registry.js";

const defaultIo = {
  input: process.stdin,
  output: process.stdout,
};

export function startRepl(
  contextRegistry: ContextRegistry,
  config: Config,
  { input, output } = defaultIo,
) {
  const replServer = repl.start({ input, output, prompt: "🤖> " });

  replServer.defineCommand("counterfact", {
    action() {
      output.write(
        "This is a read-eval-print loop (REPL), the same as the one you get when you run node with no arguments.\n",
      );
      output.write(
        "Except that it's connected to the running server, which you can access with the following globals:\n\n",
      );
      output.write(
        "- loadContext('/some/path'): to access the context object for a given path\n",
      );
      output.write(
        "- context: the root context ( same as loadContext('/') )\n",
      );
      output.write(
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
        config.proxyPaths.set("", true);
      }

      if (state === "off") {
        config.proxyPaths.set("", false);
      }

      output.write(`Proxy is ${state}: ${config.proxyUrl}\n`);

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
