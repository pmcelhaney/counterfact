#!/usr/bin/env node
import fs from "node:fs";
import nodePath from "node:path";

import { generate } from "../src/typescript-generator/generate.js";
import { init } from "../src/typescript-generator/init.js";

const EXPECTED_ARGUMENT_COUNT = 5;

// eslint-disable-next-line max-statements
async function main() {
  // eslint-disable-next-line prefer-destructuring
  const command = process.argv[2];

  const [, source, destination] = process.argv
    .slice(2)
    .map((pathString) => nodePath.join(process.cwd(), pathString));

  if (process.argv.length === EXPECTED_ARGUMENT_COUNT) {
    if (command === "generate") {
      await generate(source, destination);

      return;
    }

    if (command === "init") {
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
      process.stdout.write("  npm start --open\n");

      return;
    }
  }

  process.stdout.write(
    "Usage:\n- counterfact init <source> <destination>\n- counterfact generate <source> <destination>"
  );
}

await main();
