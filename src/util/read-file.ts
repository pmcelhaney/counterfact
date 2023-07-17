import fs from "node:fs/promises";

import nodeFetch from "node-fetch";

export async function readFile(urlOrPath: string) {
  if (urlOrPath.startsWith("http")) {
    const response = await nodeFetch(urlOrPath);

    return await response.text();
  }

  if (urlOrPath.startsWith("file")) {
    // eslint-disable-next-line total-functions/no-partial-url-constructor
    return await fs.readFile(new URL(urlOrPath), "utf8");
  }

  return await fs.readFile(urlOrPath, "utf8");
}
