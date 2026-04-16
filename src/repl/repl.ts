import repl from "node:repl";

import type { Config } from "../server/config.js";
import type { ContextRegistry } from "../server/context-registry.js";
import type { OpenApiDocument } from "../server/dispatcher.js";
import type { Registry } from "../server/registry.js";
import type { ScenarioRegistry } from "../server/scenario-registry.js";

import { RawHttpClient } from "./raw-http-client.js";
import { createRouteFunction } from "./route-builder.js";

function printToStdout(line: string) {
  process.stdout.write(`${line}\n`);
}

export type CompleterCallback = (
  err: Error | null,
  result: [string[], string],
) => void;

export type ScenarioRegistryByApi = ReadonlyMap<string, ScenarioRegistry>;

type ScenarioRegistryInput = ScenarioRegistry | ScenarioRegistryByApi;

function getScenarioRegistryByApi(
  scenarioRegistryInput?: ScenarioRegistryInput,
): ScenarioRegistryByApi {
  if (scenarioRegistryInput === undefined) {
    return new Map();
  }

  if (scenarioRegistryInput instanceof Map) {
    return scenarioRegistryInput;
  }

  return new Map<string, ScenarioRegistry>([
    ["firstApi", scenarioRegistryInput as ScenarioRegistry],
  ]);
}

function completeScenarioPath(
  scenarioRegistry: ScenarioRegistry,
  partial: string,
): string[] {
  const slashIdx = partial.lastIndexOf("/");

  if (slashIdx === -1) {
    const indexFunctions = scenarioRegistry.getExportedFunctionNames("index");
    const fileKeys = scenarioRegistry
      .getFileKeys()
      .filter((k) => k !== "index");
    const topLevelPrefixes = [
      ...new Set(fileKeys.map((k) => k.split("/")[0] + "/")),
    ];
    const allOptions = [...indexFunctions, ...topLevelPrefixes];

    return allOptions.filter((c) => c.startsWith(partial));
  }

  const fileKey = partial.slice(0, slashIdx);
  const funcPartial = partial.slice(slashIdx + 1);
  const functions = scenarioRegistry.getExportedFunctionNames(fileKey);

  return functions
    .filter((e) => e.startsWith(funcPartial))
    .map((e) => `${fileKey}/${e}`);
}

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

/**
 * Creates a tab-completion function for the REPL.
 *
 * @param registry - The route registry used to complete path arguments for `route()` and `client.*()` calls.
 * @param fallback - Optional fallback completer (e.g. the Node.js built-in completer) invoked when no custom completion matches.
 * @param scenarioRegistryInput - When provided, enables tab completion for `.scenario` commands by enumerating
 *   exported function names and file-key prefixes from loaded scenario modules keyed by API qualifier.
 */
export function createCompleter(
  registry: Registry,
  fallback?: (line: string, callback: CompleterCallback) => void,
  scenarioRegistryInput?: ScenarioRegistryInput,
) {
  const scenarioRegistryByApi = getScenarioRegistryByApi(scenarioRegistryInput);
  const qualifiers = [...scenarioRegistryByApi.keys()].sort();

  return (line: string, callback: CompleterCallback): void => {
    if (line === ".scenario" || line.startsWith(".scenario ")) {
      const afterCommand = line.slice(".scenario".length);
      const hasTrailingSpace = /\s$/u.test(line);
      const args = afterCommand.trim().split(/\s+/u).filter(Boolean);

      if (args.length === 0) {
        callback(null, [qualifiers, ""]);
        return;
      }

      const qualifier = args[0] ?? "";

      if (args.length === 1 && !hasTrailingSpace) {
        const matches = qualifiers.filter((c) => c.startsWith(qualifier));
        callback(null, [matches, qualifier]);
        return;
      }

      const partial = args.length === 1 ? "" : (args[1] ?? "");
      const scenarioRegistry = scenarioRegistryByApi.get(qualifier);
      const matches =
        scenarioRegistry === undefined
          ? []
          : completeScenarioPath(scenarioRegistry, partial);

      callback(null, [matches, partial]);
      return;
    }

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

/**
 * Launches the interactive Counterfact REPL.
 *
 * The REPL is a standard Node.js REPL augmented with:
 * - `context.<api>` / `loadContexts.<api>(path)` globals wired to each API's {@link ContextRegistry}.
 * - `client` — a {@link RawHttpClient} pre-configured for `localhost`.
 * - `route(path)` — creates a {@link RouteBuilder} for the given path.
 * - `.counterfact` — help command.
 * - `.proxy` — proxy configuration command.
 * - `.scenario` — runs a named scenario function from the scenarios directory.
 *
 * @param apis - API bindings keyed by qualifier (e.g. `"firstApi"`).
 * @param config - Server configuration.
 * @param print - Output function; defaults to writing to `stdout`.
 * @returns The configured Node.js REPL server instance.
 */
export function startRepl(
  apis: ReadonlyMap<
    string,
    {
      contextRegistry: ContextRegistry;
      openApiDocument?: OpenApiDocument;
      registry: Registry;
      scenarioRegistry?: ScenarioRegistry;
    }
  >,
  config: Pick<Config, "port" | "proxyUrl" | "proxyPaths">,
  print = printToStdout,
) {
  const defaultApi = apis.get("firstApi");

  if (defaultApi === undefined) {
    throw new Error(
      'REPL requires an API qualifier named "firstApi". Ensure the API map includes that key.',
    );
  }

  const contextByApi = new Map<string, Record<string, unknown>>();
  const loadContextByApi = new Map<
    string,
    (path: string) => Record<string, unknown>
  >();
  const routeByApi = new Map<string, (path: string) => unknown>();
  const routesByApi = new Map<string, Record<string, unknown>>();
  const scenarioRegistryByApi = new Map<string, ScenarioRegistry>();

  for (const [qualifier, api] of apis.entries()) {
    const loadContext = (path: string) =>
      api.contextRegistry.find(path) as Record<string, unknown>;

    contextByApi.set(qualifier, loadContext("/"));
    loadContextByApi.set(qualifier, loadContext);
    routeByApi.set(
      qualifier,
      createRouteFunction(config.port, "localhost", api.openApiDocument),
    );
    routesByApi.set(qualifier, {});

    if (api.scenarioRegistry !== undefined) {
      scenarioRegistryByApi.set(qualifier, api.scenarioRegistry);
    }
  }

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
    prompt: "\x1b[38;2;0;113;181m⬣> \x1b[0m",
  });

  const builtinCompleter = replServer.completer as (
    line: string,
    callback: CompleterCallback,
  ) => void;

  // completer is typed as readonly in @types/node but is writable at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (replServer as any).completer = createCompleter(
    defaultApi.registry,
    builtinCompleter,
    scenarioRegistryByApi,
  );

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
        "- loadContexts.firstApi('/some/path'): to access the context object for a given path",
      );
      print(
        "- context.firstApi: the root context object for the first API (same as loadContexts.firstApi('/'))",
      );
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

  replServer.context.loadContext =
    loadContextByApi.get("firstApi") ??
    ((path: string) => defaultApi.contextRegistry.find(path));
  replServer.context.loadContexts = Object.fromEntries(
    loadContextByApi.entries(),
  );
  replServer.context.context = Object.fromEntries(contextByApi.entries());

  replServer.context.client = new RawHttpClient("localhost", config.port);
  replServer.context.RawHttpClient = RawHttpClient;

  replServer.context.route =
    routeByApi.get("firstApi") ??
    createRouteFunction(config.port, "localhost", defaultApi.openApiDocument);
  replServer.context.routes = Object.fromEntries(routesByApi.entries());

  replServer.defineCommand("scenario", {
    async action(text: string) {
      const tokens = text.trim().split(/\s+/u).filter(Boolean);

      const apiQualifier = tokens[0] ?? "";
      const scenarioPath = tokens[1] ?? "";

      if (tokens.length !== 2 || apiQualifier === "" || scenarioPath === "") {
        print("usage: .scenario <api> <path>");
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      const scenarioRegistry = scenarioRegistryByApi.get(apiQualifier);

      if (scenarioRegistry === undefined) {
        print(`Error: Unknown API qualifier "${apiQualifier}"`);
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      const parts = scenarioPath.split("/").filter(Boolean);

      if (parts.length === 0) {
        print("usage: .scenario <api> <path>");
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
      const fileKey =
        parts.length === 1 ? "index" : parts.slice(0, -1).join("/");

      const module = scenarioRegistry.getModule(fileKey);

      if (module === undefined) {
        print(`Error: Could not find scenario file "${fileKey}"`);
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      const fn = module[functionName];

      if (typeof fn !== "function") {
        print(
          `Error: "${functionName}" is not a function exported from "${fileKey}"`,
        );
        this.clearBufferedCommand();
        this.displayPrompt();
        return;
      }

      try {
        const applyContext = {
          context: contextByApi.get(apiQualifier) as Record<string, unknown>,
          loadContext: loadContextByApi.get(apiQualifier) as (
            path: string,
          ) => Record<string, unknown>,
          route: routeByApi.get(apiQualifier) as (path: string) => unknown,
          routes: routesByApi.get(apiQualifier) as Record<string, unknown>,
        };

        await (fn as (ctx: typeof applyContext) => Promise<void> | void)(
          applyContext,
        );

        print(`Applied ${apiQualifier} ${scenarioPath}`);
      } catch (error) {
        print(`Error: ${String(error)}`);
      }

      this.clearBufferedCommand();
      this.displayPrompt();
    },

    help: 'apply a scenario script (".scenario <api> <path>" calls the named export from scenarios/)',
  });

  return replServer;
}
