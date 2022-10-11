import fs from "node:fs/promises";

import nodeFetch from "node-fetch";

export async function readFile(urlOrPath) {
  if (urlOrPath.startsWith("http")) {
    const response = await nodeFetch(urlOrPath);

    return response.text();
  }

  if (urlOrPath.startsWith("file")) {
    return fs.readFile(new URL(urlOrPath), "utf8");
  }

  return fs.readFile(urlOrPath, "utf8");
}
