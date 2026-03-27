/**
 * Register the ts-loader hook using Node's modern module.register() API.
 *
 * Usage (replaces deprecated --loader flag):
 *   node --experimental-strip-types --import ./bin/register-ts-loader.mjs bin/counterfact.js ...
 */

import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

register("./ts-loader.mjs", pathToFileURL(__dirname + "/"));
