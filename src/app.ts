import { createHttpTerminator, type HttpTerminator } from "http-terminator";

import { ApiRunner } from "./api-runner.js";
import { startRepl as startReplServer } from "./repl/repl.js";
import { createRouteFunction } from "./repl/route-builder.js";
import type { Config } from "./server/config.js";
import { ContextRegistry } from "./server/context-registry.js";
import { createKoaApp } from "./server/web-server/create-koa-app.js";
import { ScenarioRegistry } from "./server/scenario-registry.js";

export { loadOpenApiDocument } from "./server/load-openapi-document.js";
export {
  createMswHandlers,
  handleMswRequest,
  type MockRequest,
} from "./msw.js";

/**
 * Describes one API specification entry.
 *
 * When `counterfact()` is called with a `specs` array, one {@link ApiRunner}
 * is created per entry. When called without `specs`, a single entry is derived
 * from `config.openApiPath`, `config.prefix`, and `group = ""`.
 */
export interface SpecConfig {
  /** Path or URL to the OpenAPI document for this spec. */
  source: string;
  /** URL prefix that this spec's runner intercepts. */
  prefix: string;
  /** Name of the subdirectory under `config.basePath` where code is generated. */
  group: string;
}

type Scenario$ = {
  context: Record<string, unknown>;
  loadContext: (path: string) => Record<string, unknown>;
  route: (path: string) => unknown;
  routes: Record<string, unknown>;
};

export async function runStartupScenario(
  scenarioRegistry: ScenarioRegistry,
  contextRegistry: ContextRegistry,
  config: Pick<Config, "port">,
  openApiDocument?: Parameters<typeof createRouteFunction>[2],
): Promise<void> {
  const indexModule = scenarioRegistry.getModule("index");

  if (!indexModule || typeof indexModule["startup"] !== "function") {
    return;
  }

  const scenario$: Scenario$ = {
    context: contextRegistry.find("/") as Record<string, unknown>,
    loadContext: (path: string) =>
      contextRegistry.find(path) as Record<string, unknown>,
    route: createRouteFunction(config.port, "localhost", openApiDocument),
    routes: {},
  };

  await (indexModule["startup"] as (ctx: Scenario$) => Promise<void> | void)(
    scenario$,
  );
}

/**
 * Normalises the spec configuration to an array.
 *
 * When `specs` is provided it is returned as-is. When it is omitted, a
 * single-entry array is constructed from `config.openApiPath`,
 * `config.prefix`, and `group = ""` so that the rest of the code never
 * needs to branch on single-vs-multiple specs.
 */
function normalizeSpecs(
  config: Pick<Config, "openApiPath" | "prefix">,
  specs?: SpecConfig[],
): SpecConfig[] {
  if (specs !== undefined) {
    return specs;
  }

  return [{ source: config.openApiPath, prefix: config.prefix, group: "" }];
}

/**
 * Creates and configures a full Counterfact server instance.
 *
 * Supports one or more API specifications. Each spec produces its own
 * {@link ApiRunner}. When `specs` is omitted a single runner is created from
 * `config.openApiPath` and `config.prefix`.
 *
 * The returned object exposes handles for starting the server, stopping it,
 * and launching the interactive REPL.
 *
 * @param config - Runtime configuration (port, paths, feature flags, etc.).
 * @param specs - Optional array of spec entries. Omit to use a single spec
 *   derived from `config.openApiPath` and `config.prefix`.
 * @returns An object containing the configured sub-systems and two entry-point
 *   functions:
 *   - `start(options)` — generates/watches code and optionally starts the HTTP
 *     server; returns a `stop()` handle.
 *   - `startRepl()` — launches the interactive Node.js REPL connected to the
 *     live server state.
 */
export async function counterfact(config: Config, specs?: SpecConfig[]) {
  const normalizedSpecs = normalizeSpecs(
    { openApiPath: config.openApiPath, prefix: config.prefix },
    specs,
  );

  const runners = await Promise.all(
    normalizedSpecs.map((spec) =>
      ApiRunner.create(
        { ...config, openApiPath: spec.source, prefix: spec.prefix },
        spec.group,
      ),
    ),
  );

  const koaApp = createKoaApp({
    runners,
    config,
  });

  // The REPL is configured using the first runner.
  const primaryRunner = runners[0]!;

  async function start(
    options: Pick<Config, "generate" | "startServer" | "watch" | "buildCache">,
  ) {
    await Promise.all(runners.map((runner) => runner.generate()));
    await Promise.all(runners.map((runner) => runner.watch()));
    await Promise.all(runners.map((runner) => runner.start(options)));

    let httpTerminator: HttpTerminator | undefined;

    if (options.startServer) {
      await runStartupScenario(
        primaryRunner.scenarioRegistry,
        primaryRunner.contextRegistry,
        { port: config.port },
        primaryRunner.openApiDocument,
      );

      const server = koaApp.listen({
        port: config.port,
      });

      httpTerminator = createHttpTerminator({
        server,
      });
    }

    return {
      async stop() {
        await Promise.all(runners.map((runner) => runner.stopWatching()));
        await httpTerminator?.terminate();
      },
    };
  }

  return {
    contextRegistry: primaryRunner.contextRegistry,
    koaApp,
    registry: primaryRunner.registry,
    start,
    startRepl: () =>
      startReplServer(
        primaryRunner.contextRegistry,
        primaryRunner.registry,
        {
          port: config.port,
          proxyPaths: config.proxyPaths,
          proxyUrl: config.proxyUrl,
        },
        undefined, // use the default print function (stdout)
        primaryRunner.openApiDocument,
        primaryRunner.scenarioRegistry,
      ),
  };
}
