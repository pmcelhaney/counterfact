#!/usr/bin/env node
import nodePath from "node:path";

import { generate } from "../src/typescript-generator/generate.js";
import { init } from "../src/typescript-generator/init.js";

const EXPECTED_ARGUMENT_COUNT = 5;

// eslint-disable-next-line max-statements
function main() {
  // eslint-disable-next-line prefer-destructuring
  const command = process.argv[2];

  const [, source, destination] = process.argv
    .slice(2)
    .map((pathString) => nodePath.join(process.cwd(), pathString));

  if (process.argv.length === EXPECTED_ARGUMENT_COUNT) {
    if (command === "generate") {
      generate(source, destination);

      return;
    }

    if (command === "init") {
      init(source, destination);
      generate(source, nodePath.join(destination, "counterfact"));

      return;
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    "Usage:\n- counterfact init <source> <destination>\n- counterfact generate <source> <destination>"
  );
}

main();
