#!/usr/bin/env node

/**
 * bin/counterfact.js — CLI entry point for the `counterfact` command.
 *
 * Responsibilities:
 *  1. Parse CLI arguments and build a `Config` object via Commander.
 *  2. Run any pending migrations (paths → routes directory layout).
 *  3. Delegate to `counterfact()` from `src/app.ts` to start the server,
 *     code generator, transpiler, module loader, and optional REPL.
 *  4. Print the startup banner and open the browser when requested.
 *  5. Check for available updates against the npm registry.
 *
 * Architecture (high-level data flow):
 *
 *   CLI args  ──▶  Commander  ──▶  Config
 *                                     │
 *                         ┌───────────▼───────────┐
 *                         │      counterfact()     │
 *                         │   (src/app.ts)         │
 *                         │                        │
 *                         │  CodeGenerator         │  reads OpenAPI spec, emits .ts route/type files
 *                         │  Transpiler            │  compiles .ts → .cjs and watches for changes
 *                         │  ModuleLoader          │  loads compiled modules into Registry
 *                         │  Dispatcher + KoaApp   │  handles HTTP requests
 *                         │  REPL (optional)       │  interactive terminal session
 *                         └────────────────────────┘
 */

import fs from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import nodePath from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";


import { program } from "commander";
import createDebug from "debug";
import open from "open";
import { PostHog } from "posthog-node";

const MIN_NODE_VERSION = 17;

if (Number.parseInt(process.versions.node.split("."), 10) < MIN_NODE_VERSION) {
  process.stdout.write(
    `Counterfact works with Node version ${MIN_NODE_VERSION}+. You are running version ${process.version}`,
  );

  process.exit(1);
}

const __binDir = nodePath.dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(
  await readFile(nodePath.join(__binDir, "../package.json"), "utf8"),
);

const CURRENT_VERSION = packageJson.version;

// Telemetry — fire-and-forget, never blocks startup
const POSTHOG_API_KEY = "phc_msXmBxiL8FVugNMLCx9bnPQGqfEMqmyBjnVkKhHkN3m7";
const POSTHOG_HOST = "https://us.i.posthog.com";

const telemetryKey = process.env.POSTHOG_API_KEY ?? POSTHOG_API_KEY;
const telemetryHost = process.env.POSTHOG_HOST ?? POSTHOG_HOST;

const isCI = Boolean(process.env.CI);
const isBeforeRollout = new Date() < new Date("2026-05-01");
const telemetryDisabledEnv = process.env.COUNTERFACT_TELEMETRY_DISABLED;

const isTelemetryDisabled =
  isCI ||
  telemetryDisabledEnv === "true" ||
  (isBeforeRollout && telemetryDisabledEnv !== "false");

if (!isTelemetryDisabled) {
  try {
    const posthog = new PostHog(telemetryKey, { host: telemetryHost });

    console.log("capture");
    posthog.capture({
      distinctId: randomUUID(),
      event: "counterfact_started",
      properties: {
        version: CURRENT_VERSION,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        source: "counterfact-cli",
      },
    });

    posthog.shutdownAsync().catch(() => {
      // ignore errors — telemetry is best-effort
    });
  } catch {
    // ignore errors — telemetry must never surface to the user
  }
}

const taglinesFile = await readFile(
  nodePath.join(__binDir, "taglines.txt"),
  "utf8",
);

const taglines = taglinesFile.split("\n").slice(0, -1);

// Probe whether the current runtime can natively execute TypeScript with
// erasable type annotations AND resolve .js imports to .ts files (tsx-style).
async function runtimeCanExecuteErasableTs() {
  const dir = fs.mkdtempSync(nodePath.join(tmpdir(), "ts-probe-"));
  // helper.ts is imported via .js extension — the TypeScript convention used
  // throughout this codebase. If the runtime resolves helper.js → helper.ts,
  // it is fully capable of running the TypeScript source tree.
  fs.writeFileSync(
    nodePath.join(dir, "helper.ts"),
    'export const value: string = "ok";\n',
    "utf8",
  );
  fs.writeFileSync(
    nodePath.join(dir, "main.ts"),
    'import { value } from "./helper.js"; export default value;\n',
    "utf8",
  );
  try {
    const mod = await import(pathToFileURL(nodePath.join(dir, "main.ts")).href);
    return mod?.default === "ok";
  } catch {
    return false;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const nativeTs = await runtimeCanExecuteErasableTs();

const resolve = (rel) => pathToFileURL(nodePath.join(__binDir, rel)).href;

const { counterfact } = await import(
  resolve(nativeTs ? "../src/app.ts" : "../dist/app.js")
);
const { pathsToRoutes } = await import(
  resolve(
    nativeTs
      ? "../src/migrate/paths-to-routes.js"
      : "../dist/migrate/paths-to-routes.js",
  )
);
const { updateRouteTypes } = await import(
  resolve(
    nativeTs
      ? "../src/migrate/update-route-types.js"
      : "../dist/migrate/update-route-types.js",
  )
);

const DEFAULT_PORT = 3100;

const debug = createDebug("counterfact:bin:counterfact");

function isOutdated(current, latest) {
  const [cMajor, cMinor, cPatch] = current.split(".").map(Number);
  const [lMajor, lMinor, lPatch] = latest.split(".").map(Number);

  if (lMajor > cMajor) return true;
  if (lMajor === cMajor && lMinor > cMinor) return true;
  if (lMajor === cMajor && lMinor === cMinor && lPatch > cPatch) return true;

  return false;
}

async function checkForUpdates(currentVersion) {
  if (process.env.CI) {
    debug("skipping update check in CI environment");
    return;
  }

  try {
    const response = await fetch(
      "https://registry.npmjs.org/counterfact/latest",
    );

    if (!response.ok) {
      debug("update check failed with status %d", response.status);
      return;
    }

    const data = await response.json();
    const latestVersion = data.version;

    if (isOutdated(currentVersion, latestVersion)) {
      process.stdout.write(
        `\n⚠️  You're running counterfact ${currentVersion}\n`,
      );
      process.stdout.write(`   Latest version is ${latestVersion}\n`);
      process.stdout.write(`   Run: npx counterfact@latest\n`);
    }
  } catch (error) {
    debug("update check error: %o", error);
  }
}

debug("running ./bin/counterfact.js");

function padTagLine(tagLine) {
  const headerLength = 51;
  const padding = " ".repeat((headerLength - tagLine.length) / 2);

  return `${padding}${tagLine}`;
}

function createWatchMessage(config) {
  let watchMessage;

  switch (true) {
    case config.watch.routes && config.watch.types: {
      watchMessage = "   Watching for changes";

      break;
    }
    case config.watch.routes: {
      watchMessage = "   Watching routes for changes";

      break;
    }
    case config.watch.types: {
      watchMessage = "   Watching types for changes";

      break;
    }

    default: {
      watchMessage = undefined;
    }
  }

  if (!watchMessage) {
    switch (true) {
      case config.generate.routes && config.generate.types: {
        watchMessage = "Generating routes and types";

        break;
      }
      case config.generate.routes: {
        watchMessage = "Generating routes";

        break;
      }
      case config.generate.types: {
        watchMessage = "Generating types";

        break;
      }

      default: {
        watchMessage = undefined;
      }
    }
  }

  return watchMessage;
}
async function main(source, destination) {
  debug("executing the main function");

  const options = program.opts();

  const updateCheckPromise =
    options.updateCheck === false
      ? Promise.resolve()
      : checkForUpdates(CURRENT_VERSION);

  // --spec takes precedence over the positional [openapi.yaml] argument.
  // When --spec is provided, the [openapi.yaml] positional slot shifts to
  // become the [destination] argument (so `counterfact --spec api.yaml ./api`
  // works the same as `counterfact api.yaml ./api`).
  if (options.spec) {
    if (source !== "_") {
      destination = source;
    }
    source = options.spec;
  }

  const destinationPath = nodePath.resolve(destination).replaceAll("\\", "/");

  const basePath = nodePath.resolve(destinationPath).replaceAll("\\", "/");

  // If no action-related option is provided, default to all options

  const actions = ["repl", "serve", "watch", "generate", "buildCache"];
  if (
    !Object.keys(options).some((argument) =>
      actions.some((action) => argument.startsWith(action)),
    )
  ) {
    for (const action of actions) {
      options[action] = true;
    }
  }

  debug("options: %o", options);
  debug("source: %s", source);
  debug("destination: %s", destination);

  const openBrowser = options.open;

  const url = `http://localhost:${options.port}`;

  const guiUrl = `${url}/counterfact/`;

  const swaggerUrl = `${url}/counterfact/swagger/`;

  const config = {
    adminApiToken:
      options.adminApiToken ?? process.env.COUNTERFACT_ADMIN_API_TOKEN ?? "",
    alwaysFakeOptionals: options.alwaysFakeOptionals,
    basePath,

    generate: {
      routes:
        options.generate ||
        options.generateRoutes ||
        options.watch ||
        options.watchRoutes ||
        options.buildCache,

      types:
        options.generate ||
        options.generateTypes ||
        options.watch ||
        options.watchTypes ||
        options.buildCache,

      prune: Boolean(options.prune),
    },

    openApiPath: source,
    port: options.port,
    proxyPaths: new Map([["", Boolean(options.proxyUrl)]]),
    proxyUrl: options.proxyUrl ?? "",
    routePrefix: options.prefix,
    startAdminApi: options.adminApi,
    startRepl: options.repl,
    startServer: options.serve,
    buildCache: options.buildCache || false,
    validateRequests: options.validateRequest !== false,

    watch: {
      routes: options.watch || options.watchRoutes,
      types: options.watch || options.watchTypes,
    },
  };

  const configForLogging = {
    ...config,
    adminApiToken: config.adminApiToken ? "[REDACTED]" : "",
  };

  debug("loading counterfact (%o)", configForLogging);

  if (config.startAdminApi && !config.adminApiToken) {
    process.stderr.write(
      "⚠️  WARNING: The admin API is enabled without an authentication token.\n" +
        "   Any process on this machine can read and modify server state via /_counterfact/api/*.\n" +
        "   Set --admin-api-token or COUNTERFACT_ADMIN_API_TOKEN to restrict access.\n\n",
    );
  }

  let didMigrate = false;
  let didMigrateRouteTypes;

  if (fs.existsSync(nodePath.join(config.basePath, "paths"))) {
    await pathsToRoutes(config.basePath);
    await fs.promises.rmdir(nodePath.join(config.basePath, "paths"), {
      recursive: true,
    });
    await fs.promises.rmdir(nodePath.join(config.basePath, "path-types"), {
      recursive: true,
    });
    await fs.promises.rmdir(nodePath.join(config.basePath, "components"), {
      recursive: true,
    });

    didMigrate = true;
  }

  let start;
  let startRepl;
  try {
    ({ start, startRepl } = await counterfact(config));
  } catch (error) {
    process.stderr.write(
      `\n❌ ${error instanceof Error ? error.message : String(error)}\n\n`,
    );
    process.exit(1);
  }

  debug("loaded counterfact", configForLogging);

  // Migrate route type imports if needed
  debug("checking if route type migration is needed");
  didMigrateRouteTypes = await updateRouteTypes(
    config.basePath,
    config.openApiPath,
  );
  debug("route type migration check complete: %s", didMigrateRouteTypes);

  const watchMessage = createWatchMessage(config);

  const telemetryWarning = isTelemetryDisabled
    ? []
    : [
        "⚠️  Telemetry will be enabled by default starting May 1, 2026.",
        "   Learn more and how to disable: https://counterfact.dev/telemetry-discussion",
        "",
      ];

  const introduction = [
    "   ____ ____ _  _ _ _ ___ ____ ____ ____ ____ ____ ___",
    String.raw`   |___ [__] |__| |\|  |  |=== |--< |--- |--| |___  | `,
    "   " + padTagLine(taglines[Math.floor(Math.random() * taglines.length)]),
    "",
    `   Version       ${CURRENT_VERSION}`,
    `   API Base URL  ${url}`,
    source === "_" ? undefined : `   Swagger UI    ${swaggerUrl}`,
    "",
    "   Instructions  https://counterfact.dev/docs/usage.html",
    "   Help/feedback https://github.com/pmcelhaney/counterfact/issues",
    "",
    ...telemetryWarning,
    watchMessage,
    config.startServer ? "   Starting server" : undefined,
    config.startRepl
      ? "   Starting REPL (type .help for more info)"
      : undefined,
  ];

  process.stdout.write(
    introduction.filter((line) => line !== undefined).join("\n"),
  );

  process.stdout.write("\n\n");

  debug("starting server");
  try {
    await start(config);
  } catch (error) {
    process.stderr.write(
      `\n❌ ${error instanceof Error ? error.message : String(error)}\n\n`,
    );
    process.exit(1);
  }
  debug("started server");

  await updateCheckPromise;

  if (config.startRepl) {
    startRepl();
  }

  if (openBrowser) {
    debug("opening browser");
    await open(guiUrl);
    debug("opened browser");
  }

  if (didMigrate) {
    process.stdout.write("\n\n\n*******************************\n");
    process.stdout.write("MIGRATING TO NEW FILE STRUCTURE\n\n");
    process.stdout.write(
      "In preparation for version 1.0, Counterfact has migrated to a new file structure.\n",
    );
    process.stdout.write("- The paths directory has been renamed to routes.\n");
    process.stdout.write(
      "- The path-types and components directories are now stored under types.\n",
    );
    process.stdout.write("Your files have automatically been migrated.\n");
    process.stdout.write(
      "Please report any issues to https://github.com/pmcelhaney/counterfact/issues\n",
    );
    process.stdout.write("*******************************\n\n\n");
  }

  if (didMigrateRouteTypes) {
    process.stdout.write("\n\n\n*******************************\n");
    process.stdout.write("MIGRATING ROUTE TYPE IMPORTS\n\n");
    process.stdout.write(
      "Operation types now use operationId from your OpenAPI spec when available.\n",
    );
    process.stdout.write(
      "Your route files have been automatically updated to use the new type names.\n",
    );
    process.stdout.write(
      "Example: 'HTTP_GET' may now be 'getPetById' if operationId is defined.\n",
    );
    process.stdout.write(
      "Please review the changes and report any issues to:\n",
    );
    process.stdout.write("https://github.com/pmcelhaney/counterfact/issues\n");
    process.stdout.write("*******************************\n\n\n");
  }
}

program
  .name("counterfact")
  .description(
    "Counterfact is a tool for mocking REST APIs in development. See https://counterfact.dev for more info.",
  )
  .argument(
    "[openapi.yaml]",
    'path or URL to OpenAPI document or "_" to run without OpenAPI',
    "_",
  )
  .argument("[destination]", "path to generated code", ".")
  .option("-p, --port <number>", "server port number", DEFAULT_PORT)
  .option("-o, --open", "open a browser")
  .option("-g, --generate", "generate all code for both routes and types")
  .option("--generate-types", "generate types")
  .option("--generate-routes", "generate routes")
  .option("-w, --watch", "generate + watch all code for changes")
  .option("--watch-types", "generate + watch types for changes")
  .option("--watch-routes", "generate + watch routes for changes")
  .option("-s, --serve", "start the server")
  .option("-b, --build-cache", "builds the cache of compiled routes and types")
  .option("--no-admin-api", "disable the admin API at /_counterfact/api/*")
  .option("-r, --repl", "start the REPL")
  .option("--proxy-url <string>", "proxy URL")
  .option(
    "--admin-api-token <string>",
    "bearer token required for /_counterfact/api/* endpoints (defaults to COUNTERFACT_ADMIN_API_TOKEN)",
  )
  .option(
    "--prefix <string>",
    "base path from which routes will be served (e.g. /api/v1)",
    "",
  )
  .option(
    "--always-fake-optionals",
    "random responses will include optional fields",
  )
  .option(
    "--prune",
    "remove route files that no longer exist in the OpenAPI spec",
  )
  .option(
    "--spec <string>",
    "path or URL to OpenAPI document (alternative to the positional [openapi.yaml] argument)",
  )
  .option("--no-update-check", "disable the npm update check on startup")
  .option(
    "--no-validate-request",
    "disable request validation against the OpenAPI spec",
  )
  .action(main)
  .parse(process.argv);
