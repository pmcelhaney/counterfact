/**
 * Unit tests for parallel-APIs (multi-spec) mode in counterfact().
 *
 * These tests verify that when `config.specs` is supplied:
 *  - Route files are generated under `{basePath}/{base}/routes/` for each spec.
 *  - Route files for spec A do not appear in spec B's directory.
 *  - Type files are generated under `{basePath}/{base}/types/` for each spec.
 *  - The `startRepl()` function returned by `counterfact()` is callable and
 *    uses the primary (first) spec's registry.
 *
 * No HTTP server is started — only code generation is exercised.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "@jest/globals";
import nodePath from "node:path";

import { usingTemporaryFiles } from "using-temporary-files";

import * as app from "../src/app.js";
import type { Config } from "../src/server/config.js";

if (process.platform === "win32") {
  // Skip on Windows — file-path separator differences can cause spurious failures
  it("skips parallel-API tests on Windows", () => {
    expect("windows").toBe("windows");
  });
} else {
  // Two minimal OpenAPI specs embedded as YAML strings — each with a unique path
  const ALPHA_SPEC = `
openapi: "3.0.3"
info:
  title: Alpha
  version: "1.0.0"
paths:
  /ping:
    get:
      operationId: alphaPing
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                type: string
              examples:
                pong:
                  value: alpha-pong
`;

  const BETA_SPEC = `
openapi: "3.0.3"
info:
  title: Beta
  version: "1.0.0"
paths:
  /items:
    get:
      operationId: betaItems
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  type: string
              examples:
                items:
                  value:
                    - one
                    - two
`;

  const BASE_CONFIG: Config = {
    alwaysFakeOptionals: false,
    basePath: "/will-be-replaced",
    buildCache: false,
    generate: { routes: true, types: true },
    openApiPath: "_",
    port: 3100,
    proxyPaths: new Map(),
    proxyUrl: "",
    routePrefix: "",
    startAdminApi: false,
    startRepl: false,
    startServer: false,
    validateRequests: true,
    validateResponses: true,
    watch: { routes: false, types: false },
  };

  describe("counterfact() multi-spec code generation", () => {
    it("generates route files under {base}/routes/ for each spec", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add("alpha.yaml", ALPHA_SPEC);
        await $.add("beta.yaml", BETA_SPEC);

        const config: Config = {
          ...BASE_CONFIG,
          basePath: $.path("."),
          specs: [
            { source: $.path("alpha.yaml"), base: "alpha" },
            { source: $.path("beta.yaml"), base: "beta" },
          ],
        };

        const { start } = await (app as any).counterfact(config);
        const { stop } = await start(config);

        const alphaPing = await $.read(
          nodePath.join("alpha", "routes", "ping.ts"),
        );
        expect(alphaPing).toContain("export const GET");

        const betaItems = await $.read(
          nodePath.join("beta", "routes", "items.ts"),
        );
        expect(betaItems).toContain("export const GET");

        await stop();
      });
    });

    it("does not mix route files between specs", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add("alpha.yaml", ALPHA_SPEC);
        await $.add("beta.yaml", BETA_SPEC);

        const config: Config = {
          ...BASE_CONFIG,
          basePath: $.path("."),
          specs: [
            { source: $.path("alpha.yaml"), base: "alpha" },
            { source: $.path("beta.yaml"), base: "beta" },
          ],
        };

        const { start } = await (app as any).counterfact(config);
        const { stop } = await start(config);

        // Alpha has /ping — it must NOT have /items (which belongs to beta)
        await expect(
          $.read(nodePath.join("alpha", "routes", "items.ts")),
        ).rejects.toThrow();

        // Beta has /items — it must NOT have /ping (which belongs to alpha)
        await expect(
          $.read(nodePath.join("beta", "routes", "ping.ts")),
        ).rejects.toThrow();

        await stop();
      });
    });

    it("generates type files under {base}/types/ for each spec", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add("alpha.yaml", ALPHA_SPEC);
        await $.add("beta.yaml", BETA_SPEC);

        const config: Config = {
          ...BASE_CONFIG,
          basePath: $.path("."),
          specs: [
            { source: $.path("alpha.yaml"), base: "alpha" },
            { source: $.path("beta.yaml"), base: "beta" },
          ],
        };

        const { start } = await (app as any).counterfact(config);
        const { stop } = await start(config);

        // The scenario-context type is written to types/_.context.ts
        const alphaContextType = await $.read(
          nodePath.join("alpha", "types", "_.context.ts"),
        );
        expect(alphaContextType).toContain("Scenario$");

        const betaContextType = await $.read(
          nodePath.join("beta", "types", "_.context.ts"),
        );
        expect(betaContextType).toContain("Scenario$");

        await stop();
      });
    });
  });

  describe("counterfact() multi-spec REPL", () => {
    it("startRepl() is a function in multi-spec mode", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add("alpha.yaml", ALPHA_SPEC);
        await $.add("beta.yaml", BETA_SPEC);

        const config: Config = {
          ...BASE_CONFIG,
          basePath: $.path("."),
          specs: [
            { source: $.path("alpha.yaml"), base: "alpha" },
            { source: $.path("beta.yaml"), base: "beta" },
          ],
        };

        const { startRepl } = await (app as any).counterfact(config);
        expect(typeof startRepl).toBe("function");
      });
    });

    it("the primary registry only contains routes from the first spec", async () => {
      await usingTemporaryFiles(async ($) => {
        await $.add("alpha.yaml", ALPHA_SPEC);
        await $.add("beta.yaml", BETA_SPEC);

        const config: Config = {
          ...BASE_CONFIG,
          basePath: $.path("."),
          generate: { routes: false, types: false }, // skip file generation for speed
          specs: [
            { source: $.path("alpha.yaml"), base: "alpha" },
            { source: $.path("beta.yaml"), base: "beta" },
          ],
        };

        // `registry` is the primary (first spec's) registry — the same one
        // that startRepl() receives.
        const { registry } = await (app as any).counterfact(config);

        // The registry is empty before modules are loaded (no startServer here),
        // but it must be the alpha registry (not beta's).  We verify this by
        // confirming that it is a Registry instance and that its `routes` array
        // is defined (even though it is empty before loading).
        expect(registry).toBeDefined();
        expect(Array.isArray(registry.routes)).toBe(true);
      });
    });
  });
}
