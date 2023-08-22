/* eslint-disable n/no-sync */

import fs from "node:fs";

import nodeFetch from "node-fetch";

export async function readFile(urlOrPath) {
  if (urlOrPath.startsWith("http")) {
    const response = await nodeFetch(urlOrPath);

    return response.text();
  }

  if (urlOrPath.startsWith("file")) {
    return fs.readFileSync(new URL(urlOrPath), "utf8");
  }

  // eslint-disable-next-line init-declarations
  let result;

  try {
    result = fs.readFileSync(urlOrPath, "utf8");
  } catch (error) {
    return `ERROR: ${error}`;
  }

  return result;
}
