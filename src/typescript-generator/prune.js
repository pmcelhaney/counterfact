import fs from "node:fs/promises";
import nodePath from "node:path";

import createDebug from "debug";

import { normalizePath } from "../util/normalize-path.js";

const debug = createDebug("counterfact:typescript-generator:prune");

/**
 * Collects all .ts route files in a directory recursively.
 * Context files (_.context.ts) are excluded.
 * @param {string} routesDir - Path to routes directory
 * @param {string} currentPath - Current subdirectory being processed (relative to routesDir)
 * @returns {Promise<string[]>} - Array of relative paths (using forward slashes)
 */
async function collectRouteFiles(routesDir, currentPath = "") {
  const files = [];

  try {
    const fullDir = currentPath
      ? nodePath.join(routesDir, currentPath)
      : routesDir;
    const entries = await fs.readdir(fullDir, { withFileTypes: true });

    for (const entry of entries) {
      const relativePath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        files.push(...(await collectRouteFiles(routesDir, relativePath)));
      } else if (entry.name.endsWith(".ts") && entry.name !== "_.context.ts") {
        files.push(relativePath);
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  return files;
}

/**
 * Recursively removes empty directories under rootDir, but not rootDir itself.
 * @param {string} dir - Directory to check
 * @param {string} rootDir - Root directory that should never be removed
 */
async function removeEmptyDirectories(dir, rootDir) {
  let entries;

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await removeEmptyDirectories(nodePath.join(dir, entry.name), rootDir);
    }
  }

  if (nodePath.resolve(dir) === nodePath.resolve(rootDir)) {
    return;
  }

  const remaining = await fs.readdir(dir);

  if (remaining.length === 0) {
    await fs.rmdir(dir);
    debug("removed empty directory: %s", dir);
  }
}

/**
 * Converts an OpenAPI path to the expected route file path (relative to routesDir).
 * e.g. "/pet/{id}" -> "pet/{id}.ts", "/" -> "index.ts"
 * @param {string} openApiPath
 * @returns {string}
 */
function openApiPathToRouteFile(openApiPath) {
  const filePath = openApiPath === "/" ? "index" : openApiPath.slice(1);

  return `${filePath}.ts`;
}

/**
 * Prunes route files that no longer correspond to any path in the OpenAPI spec.
 * Context files (_.context.ts) are never pruned.
 * @param {string} destination - Base destination directory (contains the routes/ sub-directory)
 * @param {Iterable<string>} openApiPaths - Iterable of OpenAPI path strings (e.g. "/pet/{id}")
 * @returns {Promise<number>} - Number of files removed
 */
export async function pruneRoutes(destination, openApiPaths) {
  const routesDir = nodePath.join(destination, "routes");

  const expectedFiles = new Set(
    Array.from(openApiPaths).map(openApiPathToRouteFile),
  );

  debug("expected route files: %o", Array.from(expectedFiles));

  const actualFiles = await collectRouteFiles(routesDir);

  debug("actual route files: %o", actualFiles);

  let prunedCount = 0;

  for (const file of actualFiles) {
    const normalizedFile = normalizePath(file);

    if (!expectedFiles.has(normalizedFile)) {
      const fullPath = nodePath.join(routesDir, file);

      debug("pruning %s", fullPath);
      await fs.rm(fullPath);
      prunedCount++;
    }
  }

  await removeEmptyDirectories(routesDir, routesDir);

  debug("pruned %d files", prunedCount);

  return prunedCount;
}
