import fs from "node:fs/promises";

import nodeFetch from "node-fetch";

/**
 * Reads the content of a file or URL and returns it as a UTF-8 string.
 *
 * Accepts three kinds of inputs:
 * - **HTTP(S) URLs** — fetches with `node-fetch`.
 * - **`file://` URLs** — reads via the Node.js `fs` module.
 * - **File system paths** — reads via the Node.js `fs` module.
 *
 * @param urlOrPath - A URL string or file-system path.
 * @returns The file contents as a string.
 */
export async function readFile(urlOrPath: string) {
  if (urlOrPath.startsWith("http")) {
    const response = await nodeFetch(urlOrPath);

    return await response.text();
  }

  if (urlOrPath.startsWith("file")) {
    return await fs.readFile(new URL(urlOrPath), "utf8");
  }

  return await fs.readFile(urlOrPath, "utf8");
}
