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

  const url = `http://localhost:${options.port}`;

  const guiUrl = `${url}/counterfact/`;

  const { contextRegistry } = await start({
    basePath,
    port: options.port,
    openApiPath: source,
    includeSwaggerUi: true,
  });

  const waysToInteract = [
    `Call the REST APIs at ${url} (with your front end app, curl, Postman, etc.)`,
    `Change the implementation of the APIs by editing files under ${nodePath.join(
      basePath,
      "paths"
    )} (no need to restart)`,
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

  const replServer = repl.start("> ");

  replServer.defineCommand("counterfact", {
    help: "Get help with Counterfact",

    action() {
      process.stdout.write(
        "This is a read-eval-print loop (REPL), the same as the one you get when you run node with no arguments.\n"
      );
      process.stdout.write(
        "Except that it's connected to the running server, which you can access with the following globals:\n\n"
      );
      process.stdout.write(
        "- loadContext('/some/path'): to access the context object for a given path\n"
      );
      process.stdout.write(
        "- context: the root context ( same as loadContext('/') )\n"
      );
      process.stdout.write(
        "\nFor more information, see https://counterfact.dev/docs/usage.html\n\n"
      );

      this.clearBufferedCommand();
      this.displayPrompt();
    },
  });

  replServer.context.loadContext = (path) => contextRegistry.find(path);
  replServer.context.context = replServer.context.loadContext("/");

  if (openBrowser) {
    await open(guiUrl);
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
  .action(main)
  .parse(process.argv);
