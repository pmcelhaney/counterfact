#!/usr/bin/env node
/* eslint-disable no-magic-numbers */
import nodePath from "node:path";

import { generate } from "../src/typescript-generator/generate.js";
import { start } from "../src/start.js";

async function main() {
  const [source, destination = "."] = process.argv.slice(2);

  await generate(source, nodePath.join(process.cwd(), destination));

  const basePath = nodePath.resolve(nodePath.join(process.cwd(), destination));

  await start(basePath, 3100, source);
}

await main();
