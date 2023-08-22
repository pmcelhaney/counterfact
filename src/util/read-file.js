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

  try {
    return fs.readFile(urlOrPath, "utf8");
  } catch (error) {
    log("error reading file", urlOrPath, error);

    return `ERROR: ${error}`;
  }
}
