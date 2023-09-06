/* eslint-disable n/no-sync */
import fs from "node:fs";
import nodePath from "node:path";

export function ensureDirectoryExists(filePath) {
  const directory = nodePath.dirname(filePath);

  try {
    fs.accessSync(directory, fs.fsConstants.W_OK);
  } catch {
    // with the async option, await doesn't seem to wait for the directory to be created
    fs.mkdirSync(directory, { recursive: true });
  }
}
