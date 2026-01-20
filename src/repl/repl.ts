import repl from "node:repl";

import type { Config } from "../server/config.js";
import type { ContextRegistry } from "../server/context-registry.js";

import { RawHttpClient } from "./RawHttpClient.js";

function printToStdout(line: string) {
  process.stdout.write(`${line}\n`);
}

export function startRepl(
  contextRegistry: ContextRegistry,
  config: Config,
  print = printToStdout,
) {
  function printProxyStatus() {
    if (config.proxyUrl === "") {
      print("The proxy URL is not set.");
      print('To set it, type ".proxy url <url>');

      return;
    }

    print("Proxy Configuration:");
    print("");
    print(`The proxy URL is ${config.proxyUrl}`);
    print("");
    print("Paths prefixed with [+] will be proxied.");
    print("Paths prefixed with [-] will not be proxied.");
    print("");

    const entries = [...config.proxyPaths.entries()].sort(([path1], [path2]) =>
      path1 < path2 ? -1 : 1,
    );

    for (const [path, state] of entries) {
      print(`${state ? "[+]" : "[-]"} ${path}/`);
    }
  }

  function setProxyUrl(url: string | undefined) {
    if (url === undefined) {
      print("usage: .proxy url <url>");

      return;
    }

    config.proxyUrl = url;
    print(`proxy URL is set to ${url}`);
  }

  function turnProxyOnOrOff(text: string) {
    const [command, endpoint] = text.split(" ");

    const printEndpoint =
      endpoint === undefined || endpoint === "" ? "/" : endpoint;

    config.proxyPaths.set(
      (endpoint ?? "").replace(/\/$/u, ""),
      command === "on",
    );

    if (command === "on") {
      print(
        `Requests to ${printEndpoint} will be proxied to ${
          config.proxyUrl || "<proxy URL>"
        }${printEndpoint}`,
      );
    }

    if (command === "off") {
      print(`Requests to ${printEndpoint} will be handled by local code`);
    }
  }

  const replServer = repl.start({ prompt: "⬣> " });

  replServer.defineCommand("counterfact", {
    action() {
      print(
        "This is a read-eval-print loop (REPL), the same as the one you get when you run node with no arguments.",
      );
      print(
        "Except that it's connected to the running server, which you can access with the following globals:",
      );
      print("");
      print(
        "- loadContext('/some/path'): to access the context object for a given path",
      );
      print("- context: the root context ( same as loadContext('/') )");
      print("");
      print(
        "For more information, see https://counterfact.dev/docs/usage.html",
      );
      print("");

      this.clearBufferedCommand();
      this.displayPrompt();
    },

    help: "Get help with Counterfact",
  });

  replServer.defineCommand("proxy", {
    action(text) {
      if (text === "help" || text === "") {
        print(".proxy [on|off] - turn the proxy on/off at the root level");
        print(".proxy [on|off] <path-prefix> - turn the proxy on for a path");
        print(".proxy status - show the proxy status");
        print(".proxy help - show this message");
      } else if (text.startsWith("url")) {
        setProxyUrl(text.split(" ")[1]);
      } else if (text === "status") {
        printProxyStatus();
      } else {
        turnProxyOnOrOff(text);
      }

      this.clearBufferedCommand();
      this.displayPrompt();
    },

    help: 'proxy configuration (".proxy help" for details)',
  });

  replServer.context.loadContext = (path: string) => contextRegistry.find(path);

  replServer.context.context = replServer.context.loadContext("/");

  replServer.context.client = new RawHttpClient("localhost", config.port);
  replServer.context.RawHttpClient = RawHttpClient;

  return replServer;
}
