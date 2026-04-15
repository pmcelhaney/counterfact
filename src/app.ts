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
 * Creates and configures a full Counterfact server instance.
 *
 * Sets up the route registry, context registry, scenario registry, code
 * generator, transpiler, module loader, Koa application, and OpenAPI watcher.
 * The returned object exposes handles for starting the server, stopping it, and
 * launching the interactive REPL.
 *
 * @param config - Runtime configuration (port, paths, feature flags, etc.).
 * @returns An object containing the configured sub-systems and two entry-point
 *   functions:
 *   - `start(options)` — generates/watches code and optionally starts the HTTP
 *     server; returns a `stop()` handle.
 *   - `startRepl()` — launches the interactive Node.js REPL connected to the
 *     live server state.
 */
export async function counterfact(config: Config) {
  const runner = await ApiRunner.create(config);

  const koaApp = createKoaApp({
    runner,
    config,
  });

  async function start(
    options: Pick<Config, "generate" | "startServer" | "watch" | "buildCache">,
  ) {
    await runner.generate();
    await runner.watch();
    await runner.start(options);

    let httpTerminator: HttpTerminator | undefined;

    if (options.startServer) {
      await runStartupScenario(
        runner.scenarioRegistry,
        runner.contextRegistry,
        config,
        runner.openApiDocument,
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
        await runner.stopWatching();
        await httpTerminator?.terminate();
      },
    };
  }

  return {
    contextRegistry: runner.contextRegistry,
    koaApp,
    registry: runner.registry,
    start,
    startRepl: () =>
      startReplServer(
        runner.contextRegistry,
        runner.registry,
        config,
        undefined, // use the default print function (stdout)
        runner.openApiDocument,
        runner.scenarioRegistry,
      ),
  };
}
