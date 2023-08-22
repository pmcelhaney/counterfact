/* eslint-disable jest/require-top-level-describe */
import fs from "node:fs/promises";

import { readFile } from "../src/util/read-file.js";

test("reads the petstore file using readFile", async () => {
  const text = await readFile("./petstore.yaml", "utf8").catch(
    (error) => error
  );

  expect(text).toStrictEqual(expect.stringContaining("openapi: 3.0.2"));
});

test("reads the petstore file", async () => {
  const text = await fs
    .readFile("./petstore.yaml", "utf8")
    .catch((error) => error);

  expect(text).toStrictEqual(expect.stringContaining("openapi: 3.0.2"));
});

test("reads the package.json file", async () => {
  const text = await fs
    .readFile("./package.json", "utf8")
    .catch((error) => error);

  expect(text).toStrictEqual(expect.stringContaining("counterfact"));
});
