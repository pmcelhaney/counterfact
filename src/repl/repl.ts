import fs from "node:fs/promises";
import nodePath from "node:path";
import repl from "node:repl";

import type { Config } from "../server/config.js";
import type { ContextRegistry } from "../server/context-registry.js";
import type { OpenApiDocument } from "../server/dispatcher.js";
import type { Registry } from "../server/registry.js";
import { uncachedImport } from "../server/uncached-import.js";

import { RawHttpClient } from "./raw-http-client.js";
import { createRouteFunction } from "./route-builder.js";

function printToStdout(line: string) {
  process.stdout.write(`${line}\n`);
}

export type CompleterCallback = (
  err: Error | null,
  result: [string[], string],
) => void;

const ROUTE_BUILDER_METHODS = [
  "body(",
  "headers(",
  "help(",
  "method(",
  "missing(",
  "path(",
  "query(",
  "ready(",
  "send(",
];

export function createCompleter(
  registry: Registry,
  fallback?: (line: string, callback: CompleterCallback) => void,
) {
  return (line: string, callback: CompleterCallback): void => {
    // Check for RouteBuilder method completion: route("..."). or chained calls
    const builderMatch = line.match(/route\(.*\)\.(?<partial>[a-zA-Z]*)$/u);

    if (builderMatch) {
      const partial = builderMatch.groups?.["partial"] ?? "";
      const matches = ROUTE_BUILDER_METHODS.filter((m) =>
        m.startsWith(partial),
      );

      callback(null, [matches, partial]);

      return;
    }

    const match = line.match(
      /(?:client\.(?:get|post|put|patch|delete)|route)\("(?<partial>[^"]*)$/u,
    );

    if (!match) {
      if (fallback) {
        fallback(line, callback);
      } else {
        callback(null, [[], line]);
      }

      return;
    }

    const partial = match.groups?.["partial"] ?? "";
    const routes = registry.routes.map((route) => route.path);
    const matches = routes.filter((route) => route.startsWith(partial));

    callback(null, [matches, partial]);
  };
}

export function startRepl(
  contextRegistry: ContextRegistry,
  registry: Registry,
  config: Config,
  print = printToStdout,
  openApiDocument?: OpenApiDocument,
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

  const replServer = repl.start({
    prompt: "⬣> ",
  });

  const builtinCompleter = replServer.completer as (
    line: string,
    callback: CompleterCallback,
  ) => void;

  // completer is typed as readonly in @types/node but is writable at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (replServer as any).completer = createCompleter(registry, builtinCompleter);

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
      print(
        "- route('/some/path'): create a request builder for the given path",
      );
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
    action(text: string) {
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

  replServer.context.route = createRouteFunction(
    config.port,
    "localhost",
    openApiDocument,
  );

  replServer.context.routes = {};

  replServer.defineCommand("apply", {
    async action(text: string) {
      const parts = text.trim().split("/").filter(Boolean);

      if (parts.length === 0) {
        print("usage: .apply <path>");
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      if (parts.some((part) => part === ".." || part === ".")) {
        print("Error: Path must not contain '.' or '..' segments");
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      const functionName = parts[parts.length - 1] ?? "";
      const fileParts = parts.slice(0, -1);
      const scenariosDir = nodePath.join(config.basePath, "scenarios");
      const fileBase =
        fileParts.length > 0
          ? nodePath.join(scenariosDir, ...fileParts)
          : nodePath.join(scenariosDir, "index");

      // Guard against path traversal: resolved path must stay within scenariosDir
      const resolvedBase = nodePath.resolve(fileBase);
      const resolvedScenariosDir = nodePath.resolve(scenariosDir);

      if (
        !resolvedBase.startsWith(resolvedScenariosDir + nodePath.sep) &&
        resolvedBase !== resolvedScenariosDir
      ) {
        print("Error: Path must not escape the scenarios directory");
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      let filePath: string | undefined;

      for (const ext of [".ts", ".js"]) {
        const candidate = fileBase + ext;

        try {
          await fs.access(candidate);
          filePath = candidate;
          break;
        } catch {
          // file not found with this extension, try next
        }
      }

      if (filePath === undefined) {
        print(`Error: Could not find ${fileBase}.ts or ${fileBase}.js`);
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      try {
        const mod = await uncachedImport(filePath);
        const fn = (mod as Record<string, unknown>)[functionName];

        if (typeof fn !== "function") {
          print(
            `Error: "${functionName}" is not a function exported from ${nodePath.relative(config.basePath, filePath)}`,
          );
          this.clearBufferedCommand();
          this.displayPrompt();
          return;
        }

        const applyContext = {
          context: replServer.context["context"] as Record<string, unknown>,
          loadContext: replServer.context["loadContext"] as (
            path: string,
          ) => Record<string, unknown>,
          route: replServer.context["route"] as (path: string) => unknown,
          routes: replServer.context["routes"] as Record<string, unknown>,
        };

        await (fn as (ctx: typeof applyContext) => Promise<void> | void)(
          applyContext,
        );

        print(`Applied ${text.trim()}`);
      } catch (error) {
        print(`Error: ${String(error)}`);
      }

      this.clearBufferedCommand();
      this.displayPrompt();
    },

    help: 'apply a scenario script (".apply <path>" calls the named export from scenarios/)',
  });

  return replServer;
}
