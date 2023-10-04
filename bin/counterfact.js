#!/usr/bin/env node

import nodePath from "node:path";

import { program } from "commander";
import createDebug from "debug";
import open from "open";

import { migrate } from "../dist/src/migrations/0.27.js";
import { counterfact } from "../dist/src/server/app.js";
import { startRepl } from "../dist/src/server/repl.js";
import { generate } from "../dist/src/typescript-generator/generate.js";

const DEFAULT_PORT = 3100;

const debug = createDebug("counterfact:bin:counterfact");

debug("running ./bin/counterfact.js");

// eslint-disable-next-line max-statements
async function main(source, destination) {
  debug("executing the main function");

  const options = program.opts();

  debug("options: %o", options);
  debug("source: %s", source);
  debug("destination: %s", destination);

  const destinationPath = nodePath
    .join(process.cwd(), destination)
    .replaceAll("\\", "/");

  debug("migrating code from before 0.27.0");
  migrate(destinationPath);
  debug("done with migration");

  debug('generating code at "%s"', destinationPath);

  await generate(source, destinationPath);

  debug("generated code", destinationPath);

  const basePath = nodePath.resolve(destinationPath).replaceAll("\\", "/");

  const openBrowser = options.open;

  const url = `http://localhost:${options.port}`;

  const guiUrl = `${url}/counterfact/`;

  const config = {
    basePath,
    includeSwaggerUi: true,
    openApiPath: source,
    port: options.port,
    proxyEnabled: Boolean(options.proxyUrl),
    proxyUrl: options.proxyUrl,
  };

  debug("starting server (%o)", config);

  const { contextRegistry } = await counterfact(config);

  debug("started server");

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
    waysToInteract.map((text, index) => `${index + 1}. ${text}`).join("\n"),
  );

  process.stdout.write("\n\n");

  process.stdout.write("Starting REPL...\n");

  debug("starting repl");

  startRepl(contextRegistry, config);

  debug("started repl");

  if (openBrowser) {
    debug("opening browser");
    await open(guiUrl);
    debug("opened browser");
  }
}

program
  .name("counterfact")
  .description(
    "Counterfact is a tool for generating a REST API from an OpenAPI document.",
  )
  .argument("<openapi.yaml>", "path or URL to OpenAPI document")
  .argument("[destination]", "path to generated code", ".")
  .option("--port <number>", "server port number", DEFAULT_PORT)
  .option("--swagger", "include swagger-ui")
  .option("--open", "open a browser")
  .option("--proxy-url <string>", "proxy URL")
  .action(main)
  // eslint-disable-next-line sonar/process-argv
  .parse(process.argv);
