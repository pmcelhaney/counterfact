#!/usr/bin/env node
/* eslint-disable no-magic-numbers */
import fs from "node:fs";
import nodePath from "node:path";

import { generate } from "../src/typescript-generator/generate.js";
import { init } from "../src/typescript-generator/init.js";
import { start } from "../src/start.js";

// eslint-disable-next-line max-statements, sonarjs/cognitive-complexity, complexity
async function main() {
  // eslint-disable-next-line prefer-destructuring
  const command = process.argv[2];

  if (command === "start") {
    const basePath = process.argv[3]
      ? nodePath.resolve(process.argv[3])
      : process.cwd();
    const port = process.argv[4] ?? 3100;

    const pathsRoot = nodePath.join(basePath, "paths");

    // eslint-disable-next-line node/no-sync
    if (fs.existsSync(pathsRoot)) {
      await start(basePath, port);

      return;
    }

    process.stdout.write(
      `Error: expected to find a directory at ${pathsRoot}\n`
    );
    process.stdout.write(
      "This directory should contain JS files corresponding to REST endpoints.\n\n"
    );
    process.exitCode = 1;
  }

  if (command === "generate" && process.argv.length === 5) {
    const [, source, destination] = process.argv
      .slice(2)
      .map((pathString) => nodePath.join(process.cwd(), pathString));

    await generate(source, destination);

    return;
  }

  if (command === "init" && process.argv.length === 5) {
    const [, source, destination] = process.argv
      .slice(2)
      .map((pathString) => nodePath.join(process.cwd(), pathString));

    // eslint-disable-next-line node/no-sync
    if (fs.existsSync(destination)) {
      process.stdout.write(`Destination already exists: ${destination}\n`);
      process.exitCode = 1;

      return;
    }

    await init(source, destination);
    await generate(source, nodePath.join(destination, "counterfact"));

    process.stdout.write(`Created a new project at ${destination}!\n\n`);
    process.stdout.write("Next steps: \n");
    process.stdout.write(`  cd ${destination}\n`);
    process.stdout.write("  npm install\n");
    process.stdout.write("  npm start -- --open\n");

    return;
  }

  if (command === "go" && process.argv.length === 5) {
    const [, source, destination = "."] = process.argv
      .slice(2)
      .map((pathString) => nodePath.join(process.cwd(), pathString));

    await generate(source, destination);

    const basePath = nodePath.resolve(destination);

    await start(basePath, 3100);

    return;
  }

  process.stdout.write("Usage:\n");
  process.stdout.write("  counterfact start [basePath] [port]\n");
  process.stdout.write("  counterfact generate [source] [destination]\n");
  process.stdout.write("  counterfact init [source] [destination]\n");
}

await main();
