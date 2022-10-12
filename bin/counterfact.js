#!/usr/bin/env node

import nodePath from "node:path";
import repl from "node:repl";

import { program } from "commander";
import open from "open";

import { generate } from "../src/typescript-generator/generate.js";
import { start } from "../src/server/start.js";

const DEFAULT_PORT = 3100;

// eslint-disable-next-line max-statements
async function main(source, destination) {
  const options = program.opts();

  await generate(source, nodePath.join(process.cwd(), destination));

  const basePath = nodePath.resolve(nodePath.join(process.cwd(), destination));

  const openBrowser = options.open;
  const includeSwagger = options.swagger || openBrowser;
  const startServer = options.server || includeSwagger;

  if (startServer) {
    const { contextRegistry } = await start({
      basePath,
      port: options.port,
      openApiPath: source,
      includeSwaggerUi: includeSwagger,
    });

    process.stdout.write(
      `API is running at http://localhost:${options.port}.\n`
    );

    process.stdout.write(
      '\n\nStarting REPL... (start with `const context = loadContext("/")`)\n'
    );

    const replServer = repl.start("> ");

    replServer.context.loadContext = (path) => contextRegistry.find(path);
  }

  if (openBrowser) {
    await open(`http://localhost:${options.port}/counterfact`);
  }
}

program
  .name("counterfact")
  .description(
    "Counterfact is a tool for generating a REST API from an OpenAPI document."
  )
  .argument("<openapi.yaml>", "path or URL to OpenAPI document")
  .argument("[destination]", "path to generated code", ".")
  .option("--serve", "start the server after generating code")
  .option("--port <number>", "server port number", DEFAULT_PORT)
  .option("--swagger", "include swagger-ui (implies --serve)")
  .option(
    "--open",
    "open a browser to swagger-ui (implies --swagger and --serve)"
  )
  .action(main)
  .parse(process.argv);
