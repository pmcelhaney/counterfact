#!/usr/bin/env node
/* eslint-disable complexity */

import fs from "node:fs";
import { readFile } from "node:fs/promises";
import nodePath from "node:path";
import { fileURLToPath } from "node:url";

import { program } from "commander";
import createDebug from "debug";
import open from "open";

import { counterfact } from "../dist/app.js";
import { pathsToRoutes } from "../dist/migrate/paths-to-routes.js";

const MIN_NODE_VERSION = 17;

if (Number.parseInt(process.versions.node.split("."), 10) < MIN_NODE_VERSION) {
  process.stdout.write(
    `Counterfact works with Node version ${MIN_NODE_VERSION}+. You are running version ${process.version}`,
  );
  // eslint-disable-next-line n/no-process-exit
  process.exit(1);
}

const taglinesFile = await readFile(
  nodePath.join(
    nodePath.dirname(fileURLToPath(import.meta.url)),
    "taglines.txt",
  ),
  "utf8",
);

const taglines = taglinesFile.split("\n").slice(0, -1);

const DEFAULT_PORT = 3100;

const debug = createDebug("counterfact:bin:counterfact");

debug("running ./bin/counterfact.js");

function padTagLine(tagLine) {
  const headerLength = 51;
  const padding = " ".repeat((headerLength - tagLine.length) / 2);

  return `${padding}${tagLine}`;
}

// eslint-disable-next-line max-statements
function createWatchMessage(config) {
  let watchMessage = "";

  switch (true) {
    case config.watch.routes && config.watch.types: {
      watchMessage = "Watching for changes";

      break;
    }
    case config.watch.routes: {
      watchMessage = "Watching routes for changes";

      break;
    }
    case config.watch.types: {
      watchMessage = "Watching types for changes";

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

// eslint-disable-next-line max-statements
async function main(source, destination) {
  debug("executing the main function");

  const options = program.opts();
  // eslint-disable-next-line sonar/process-argv
  const args = process.argv;

  const destinationPath = nodePath
    .join(process.cwd(), destination)
    .replaceAll("\\", "/");

  const basePath = nodePath.resolve(destinationPath).replaceAll("\\", "/");

  // If no options are provided, default to all options
  if (!args.some((argument) => argument.startsWith("-"))) {
    options.repl = true;
    options.serve = true;
    options.watch = true;
    options.generate = true;
  }

  debug("options: %o", options);
  debug("source: %s", source);
  debug("destination: %s", destination);

  const openBrowser = options.open;

  const url = `http://localhost:${options.port}`;

  const guiUrl = `${url}/counterfact/`;

  const swaggerUrl = `${url}/counterfact/swagger/`;

  const config = {
    basePath,

    generate: {
      routes:
        options.generate ||
        options.generateRoutes ||
        options.watch ||
        options.watchRoutes,

      types:
        options.generate ||
        options.generateTypes ||
        options.watch ||
        options.watchTypes,
    },

    includeSwaggerUi: true,
    openApiPath: source,
    port: options.port,
    proxyPaths: new Map([["", Boolean(options.proxyUrl)]]),
    proxyUrl: options.proxyUrl ?? "",
    routePrefix: options.prefix,
    startRepl: options.repl,
    startServer: options.serve,

    watch: {
      routes: options.watch || options.watchRoutes,
      types: options.watch || options.watchTypes,
    },
  };

  debug("loading counterfact (%o)", config);

  // eslint-disable-next-line n/no-sync
  if (fs.existsSync(nodePath.join(config.basePath, "paths"))) {
    console.log("migrating");
    await pathsToRoutes(config.basePath);
  }

  const { start } = await counterfact(config);

  debug("loaded counterfact", config);

  const watchMessage = createWatchMessage(config);

  const introduction = [
    "____ ____ _  _ _ _ ___ ____ ____ ____ ____ ____ ___",
    "|___ [__] |__| |\\|  |  |=== |--< |--- |--| |___  | ",
    padTagLine(taglines[Math.floor(Math.random() * taglines.length)]),
    "",
    `| API Base URL  ==> ${url}`,
    source === "_" ? undefined : `| Swagger UI    ==> ${swaggerUrl}`,
    "",
    "| Instructions  ==> https://counterfact.dev/docs/usage.html",
    "| Help/feedback ==> https://github.com/pmcelhaney/counterfact/issues",
    "",
    "🎉 VERSION 1.0 IS COMING! LEARN MORE:",
    "   https://github.com/pmcelhaney/counterfact/issues/823",
    "",
    watchMessage,
    config.startServer ? "Starting server" : undefined,
    config.startRepl ? "Starting REPL, type .help for more info" : undefined,
  ];

  process.stdout.write(
    introduction.filter((line) => line !== undefined).join("\n"),
  );

  process.stdout.write("\n\n");

  debug("starting server");
  await start(config);
  debug("started server");

  if (openBrowser) {
    debug("opening browser");
    await open(guiUrl);
    debug("opened browser");
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
  .option("--swagger", "include swagger-ui")
  .option("-o, --open", "open a browser")
  .option("-g, --generate", "generate all code for both routes and types")
  .option("--generate-types", "generate types")
  .option("--generate-routes", "generate routes")
  .option("-w, --watch", "generate + watch all code for changes")
  .option("--watch-types", "generate + watch types for changes")
  .option("--watch-routes", "generate + watch routes for changes")
  .option("-s, --serve", "start the server")
  .option("-r, --repl", "start the REPL")
  .option("--proxy-url <string>", "proxy URL")
  .option(
    "--prefix <string>",
    "base path from which routes will be served (e.g. /api/v1)",
    "",
  )
  .action(main)
  // eslint-disable-next-line sonar/process-argv
  .parse(process.argv);
