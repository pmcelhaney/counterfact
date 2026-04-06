import fs from "node:fs";
import nodePath from "node:path";

export function ensureDirectoryExists(filePath: string): void {
  const directory = nodePath.dirname(filePath);

  try {
    fs.accessSync(directory, fs.constants.W_OK);
  } catch {
    // with the async option, await doesn't seem to wait for the directory to be created
    fs.mkdirSync(directory, { recursive: true });
  }
}
