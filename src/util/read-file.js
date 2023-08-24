/* eslint-disable n/no-sync */

import fs from "node:fs";

import nodeFetch from "node-fetch";
import createDebug from "debug";

const debug = createDebug("counterfact:util:read-file");

// eslint-disable-next-line max-statements
export async function readFile(urlOrPath) {
  debug("reading file %s", urlOrPath);

  if (urlOrPath.startsWith("http")) {
    debug("it's an HTTP URL, using node-fetch to read it");

    const response = await nodeFetch(urlOrPath);

    debug("read the file using node-fetch");

    return response.text();
  }

  if (urlOrPath.startsWith("file")) {
    debug("it's a file URL, using fs.readFileSync to read it");

    const result = fs.readFileSync(new URL(urlOrPath), "utf8");

    debug("read the file: %s", result);

    return result;
  }

  debug("it's a path, using fs.readFileSync to read it");

  const result = fs.readFileSync(urlOrPath, "utf8");

  debug("read the file: %s", result);

  return result;
}
