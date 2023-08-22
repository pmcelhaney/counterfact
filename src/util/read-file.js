/* eslint-disable no-magic-numbers */
import fs from "node:fs/promises";

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

    return fs.readFile(new URL(urlOrPath), "utf8");
  }

  log("reading plain old file", urlOrPath);

  // eslint-disable-next-line init-declarations
  let result;

  try {
    result = fs.readFile(urlOrPath, "utf8");

    log("did read plain old file", urlOrPath);
  } catch (error) {
    log("error reading file", urlOrPath, error);

    return `ERROR: ${error}`;
  }

  log("waiting for result to resolve");

  // eslint-disable-next-line promise/avoid-new
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve("COULD NOT READ FILE IN A REASONABLE TIME"), 1000);
  });

  const text = await Promise.race([timeout, result]);

  log("returning result", text);

  return result;
}
