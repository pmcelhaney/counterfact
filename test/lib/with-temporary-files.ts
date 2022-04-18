import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";

async function ensureDirectoryExists(filePath: string) {
  const directory = path.dirname(filePath);
  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

function createAddFunction(basePath: string) {
  return async function add(filePath: string, content: string) {
    const fullPath = path.join(basePath, filePath);

    await ensureDirectoryExists(fullPath);
    await fs.writeFile(fullPath, content);
  };
}

function createRemoveFunction(basePath: string) {
  return async function remove(filePath: string) {
    const fullPath = path.join(basePath, filePath);

    await ensureDirectoryExists(fullPath);
    await fs.rm(fullPath);
  };
}

export async function withTemporaryFiles(
  files: Readonly<{ [path: string]: string }>,
  ...callbacks: readonly ((
    directory: string,
    {
      add,
      remove,
    }: Readonly<{
      add: (path: string, content: string) => Promise<void>;
      remove: (path: string) => Promise<void>;
    }>
  ) => Promise<void>)[]
): Promise<void> {
  const temporaryDirectory = `${await fs.mkdtemp(
    path.join(os.tmpdir(), "wtf-")
  )}/`;

  try {
    const writes = Object.entries(files).map(async (entry) => {
      const [filename, contents] = entry;
      const filePath = path.join(temporaryDirectory, filename);

      await ensureDirectoryExists(filePath);
      await fs.writeFile(filePath, contents);
    });

    await Promise.all(writes);

    for (const callback of callbacks) {
      // eslint-disable-next-line no-await-in-loop, node/callback-return
      await callback(temporaryDirectory, {
        add: createAddFunction(temporaryDirectory),
        remove: createRemoveFunction(temporaryDirectory),
      });
    }
  } finally {
    await fs.rm(temporaryDirectory, {
      recursive: true,
    });
  }
}
