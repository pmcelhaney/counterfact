import fs from "node:fs";

import yaml from "yaml";

import { generatePaths } from "./src/generate-typescript.js";

const file = fs.readFileSync("./demo-ts/openapi/openapi.yaml", "utf8");

const json = yaml.parse(file);

console.log(generatePaths(json.paths));
