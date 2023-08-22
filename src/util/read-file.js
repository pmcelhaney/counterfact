/* eslint-disable n/no-sync */

import fs from "node:fs";

import nodeFetch from "node-fetch";

function log(...strings) {
  process.stdout.write(`[read-file] ${strings.join("\t")}\n`);
}

// eslint-disable-next-line max-statements
export async function readFile(urlOrPath) {
  log("reading file or URL", urlOrPath);

  if (urlOrPath.startsWith("http")) {
    log("reading url", urlOrPath);

    const response = await nodeFetch(urlOrPath);

    return response.text();
  }

  if (urlOrPath.startsWith("file")) {
    log("reading file URl", urlOrPath);

    return fs.readFileSync(new URL(urlOrPath), "utf8");
  }

  log("reading plain old file", urlOrPath);

  // eslint-disable-next-line init-declarations
  let result;

  try {
    result = fs.readFileSync(urlOrPath, "utf8");

    log("did read plain old file", urlOrPath);
  } catch (error) {
    log("error reading file", urlOrPath, error);

    return `ERROR: ${error}`;
  }

  return result;
}
