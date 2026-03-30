import { constants as fsConstants } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { normalizePath } from "../../src/util/normalize-path.js";

const DEBUG = false;

interface Operations {
  add: (filePath: string, content: string) => Promise<void>;
  addDirectory: (filePath: string) => Promise<void>;
  path: (filePath: string) => string;
  remove: (filePath: string) => Promise<void>;
}

async function ensureDirectoryExists(filePath: string) {
  const directory = nodePath.dirname(filePath);

  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

function createAddFunction(basePath: string) {
  return async function add(filePath: string, content: string) {
    const fullPath = normalizePath(nodePath.join(basePath, filePath));

    await ensureDirectoryExists(fullPath);

    await fs.writeFile(fullPath, content);
  };
}

function createAddDirectoryFunction(basePath: string) {
  return async function addDirectory(filePath: string) {
    const fullPath = normalizePath(nodePath.join(basePath, filePath));

    await fs.mkdir(fullPath, { recursive: true });
  };
}

function createRemoveFunction(basePath: string) {
  return async function remove(filePath: string) {
    const fullPath = normalizePath(nodePath.join(basePath, filePath));

    await ensureDirectoryExists(fullPath);
    await fs.rm(fullPath);
  };
}

export async function withTemporaryFiles(
  files: { [name: string]: string },
  ...callbacks: ((directory: string, operations: Operations) => Promise<void>)[]
) {
  const baseDirectory = DEBUG
    ? nodePath.resolve(process.cwd(), "./")
    : os.tmpdir();

  const temporaryDirectory = normalizePath(
    `${await fs.mkdtemp(nodePath.join(baseDirectory, "wtf-"))}/`,
  );

  try {
    const writes = Object.entries(files).map(async (entry) => {
      const [filename, contents] = entry;
      const filePath = normalizePath(nodePath.join(temporaryDirectory, filename));

      await ensureDirectoryExists(filePath);

      await fs.writeFile(filePath, contents);
    });

    await Promise.all(writes);

    for (const callback of callbacks) {
      await callback(temporaryDirectory, {
        add: createAddFunction(temporaryDirectory),
        addDirectory: createAddDirectoryFunction(temporaryDirectory),

        path(relativePath) {
          return normalizePath(nodePath.join(temporaryDirectory, relativePath));
        },

        remove: createRemoveFunction(temporaryDirectory),
      });
    }
  } finally {
    if (!DEBUG) {
      await fs.rm(temporaryDirectory, { recursive: true });
    }
  }
}
