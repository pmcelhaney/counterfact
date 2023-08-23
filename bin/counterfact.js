#!/usr/bin/env ts-node --esm --transpileOnly

import nodePath from "node:path";

import debug from "debug";
import { program } from "commander";
import open from "open";

import { generate } from "../src/typescript-generator/generate.js";
import { start } from "../src/server/start.js";
import { startRepl } from "../src/server/repl.js";

const DEFAULT_PORT = 3100;

const log = debug("counterfact");

log("running ./bin/counterfact.js");

// eslint-disable-next-line max-statements
async function main(source, destination) {
  log("executing the main function");

  const options = program.opts();

  log("options: %o", options);
  log("source: %s", source);
  log("destination: %s", destination);

  const destinationPath = nodePath
    .join(process.cwd(), destination)
    .replaceAll("\\", "/");

  log('generating code at "%s"', destinationPath);

  await generate(source, destinationPath);

  log("generated code", destinationPath);

  const basePath = nodePath.resolve(destinationPath);

  const openBrowser = options.open;

  const url = `http://localhost:${options.port}`;

  const guiUrl = `${url}/counterfact/`;

  const config = {
    basePath,
    port: options.port,
    openApiPath: source,
    includeSwaggerUi: true,
    proxyUrl: options.proxyUrl,
    proxyEnabled: Boolean(options.proxyUrl),
  };

  log("starting server (%o)", config);

  const { contextRegistry } = await start(config);

  log("started server");

  const waysToInteract = [
    `Call the REST APIs at ${url} (with your front end app, curl, Postman, etc.)`,
    `Change the implementation of the APIs by editing files under ${nodePath
      .join(basePath, "paths")
      .replaceAll("\\", "/")} (no need to restart)`,
    `Use the GUI at ${guiUrl}`,
    "Use the REPL below (type .counterfact for more information)",
  ];

  const introduction = [
    "",
    "Welcome to Counterfact!",
    "",
    "Counterfact is a mock server used to develop and test your front end app.",
    "There are several ways to poke and prod the server in order to make it behave the way you need for testing.",
    "",
  ];

  process.stdout.write(`${introduction.join("\n")}\n`);

  process.stdout.write(
    waysToInteract.map((text, index) => `${index + 1}. ${text}`).join("\n")
  );

  process.stdout.write("\n\n");

  process.stdout.write("Starting REPL...\n");

  log("starting repl");

  startRepl(contextRegistry, config);

  log("started repl");

  if (openBrowser) {
    log("opening browser");
    await open(guiUrl);
    log("opened browser");
  }
}

program
  .name("counterfact")
  .description(
    "Counterfact is a tool for generating a REST API from an OpenAPI document."
  )
  .argument("<openapi.yaml>", "path or URL to OpenAPI document")
  .argument("[destination]", "path to generated code", ".")
  .option("--port <number>", "server port number", DEFAULT_PORT)
  .option("--swagger", "include swagger-ui")
  .option("--open", "open a browser")
  .option("--proxy-url <string>", "proxy URL")
  .action(main)
  .parse(process.argv);
