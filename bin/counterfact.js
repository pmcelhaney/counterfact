#!/usr/bin/env node
import nodePath from "node:path";

import { generate } from "../src/typescript-generator/generate.js";

const EXPECTED_ARGUMENT_COUNT = 5;

if (
  process.argv.length !== EXPECTED_ARGUMENT_COUNT ||
  process.argv[2] !== "generate"
) {
  // eslint-disable-next-line no-console
  console.log("Usage: counterfact generate <source> <destination>");
  // eslint-disable-next-line node/no-process-exit, no-process-exit
  process.exit(1);
}

const [, source, destination] = process.argv
  .slice(2)
  .map((pathString) => nodePath.join(process.cwd(), pathString));

generate(source, destination);
