import fs from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import os from "node:os";
import nodePath from "node:path";

const DEBUG = false;

async function ensureDirectoryExists(filePath) {
  const directory = nodePath.dirname(filePath);

  try {
    await fs.access(directory, fsConstants.W_OK);
  } catch {
    await fs.mkdir(directory, { recursive: true });
  }
}

function createAddFunction(basePath) {
  return async function add(filePath, content) {
    const fullPath = nodePath.join(basePath, filePath).replaceAll("\\", "/");

    await ensureDirectoryExists(fullPath);
    await fs.writeFile(fullPath, content);
  };
}

function createAddDirectoryFunction(basePath) {
  return async function addDirectory(filePath) {
    const fullPath = nodePath.join(basePath, filePath).replaceAll("\\", "/");

    await fs.mkdir(fullPath, { recursive: true });
  };
}

function createRemoveFunction(basePath) {
  return async function remove(filePath) {
    const fullPath = nodePath.join(basePath, filePath).replaceAll("\\", "/");

    await ensureDirectoryExists(fullPath);
    await fs.rm(fullPath);
  };
}

export async function withTemporaryFiles(files, ...callbacks) {
  const baseDirectory = DEBUG
    ? nodePath.resolve(process.cwd(), "./")
    : os.tmpdir();

  const temporaryDirectory = `${await fs.mkdtemp(
    nodePath.join(baseDirectory, "wtf-")
  )}/`.replaceAll("\\", "/");

  try {
    const writes = Object.entries(files).map(async (entry) => {
      const [filename, contents] = entry;
      const filePath = nodePath
        .join(temporaryDirectory, filename)
        .replaceAll("\\", "/");

      await ensureDirectoryExists(filePath);
      await fs.writeFile(filePath, contents);
    });

    await Promise.all(writes);

    for (const callback of callbacks) {
      // eslint-disable-next-line no-await-in-loop, n/callback-return
      await callback(temporaryDirectory, {
        add: createAddFunction(temporaryDirectory),
        remove: createRemoveFunction(temporaryDirectory),
        addDirectory: createAddDirectoryFunction(temporaryDirectory),

        path(relativePath) {
          return nodePath
            .join(temporaryDirectory, relativePath)
            .replaceAll("\\", "/");
        },
      });
    }
  } finally {
    if (!DEBUG) {
      await fs.rm(temporaryDirectory, { recursive: true });
    }
  }
}
