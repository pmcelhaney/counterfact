#!/usr/bin/env node
/* eslint-disable no-magic-numbers */
import nodePath from "node:path";

import { generate } from "../src/typescript-generator/generate.js";
import { start } from "../src/start.js";

async function main() {
  const [source, destination = "."] = process.argv
    .slice(2)
    .map((pathString) => nodePath.join(process.cwd(), pathString));

  await generate(source, destination);

  const basePath = nodePath.resolve(destination);

  await start(basePath, 3100);

  // process.stdout.write("Usage:\n");
  // process.stdout.write("  counterfact start [basePath] [port]\n");
  // process.stdout.write("  counterfact generate [source] [destination]\n");
  // process.stdout.write("  counterfact init [source] [destination]\n");
}

await main();
