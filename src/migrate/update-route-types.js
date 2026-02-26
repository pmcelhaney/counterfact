import { promises as fs } from "node:fs";
import path from "node:path";

import createDebug from "debug";

import { OperationTypeCoder } from "../typescript-generator/operation-type-coder.js";
import { Specification } from "../typescript-generator/specification.js";

const debug = createDebug("counterfact:migrate:update-route-types");

const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
  "HEAD",
  "OPTIONS",
];

/**
 * Converts an OpenAPI path to a file system path
 * e.g., "/hello/{name}" -> "hello/{name}"
 */
function openApiPathToFilePath(openApiPath) {
  if (openApiPath === "/") {
    return "index";
  }
  return openApiPath.startsWith("/") ? openApiPath.slice(1) : openApiPath;
}

/**
 * Builds a mapping of route file paths to their operation type names per method
 * @param {Specification} specification - The OpenAPI specification
 * @returns {Promise<Map<string, Map<string, string>>>} - Map of filePath -> Map of method -> typeName
 */
async function buildTypeNameMapping(specification) {
  debug("building type name mapping from specification");

  const mapping = new Map();

  try {
    const paths = specification.getRequirement("#/paths");

    if (!paths) {
      debug("no paths found in specification");
      return mapping;
    }

    const securityRequirement = specification.getRequirement(
      "#/components/securitySchemes",
    );
    const securitySchemes = Object.values(securityRequirement?.data ?? {});

    paths.forEach((pathDefinition, openApiPath) => {
      const filePath = openApiPathToFilePath(openApiPath);
      const methodMap = new Map();

      pathDefinition.forEach((operation, requestMethod) => {
        // Skip if not a standard HTTP method
        if (!HTTP_METHODS.includes(requestMethod.toUpperCase())) {
          return;
        }

        // Create the type coder to get the correct type name
        const typeCoder = new OperationTypeCoder(
          operation,
          requestMethod,
          securitySchemes,
        );

        // Get the type name (first from the names generator)
        const typeName = typeCoder.names().next().value;

        methodMap.set(requestMethod.toUpperCase(), typeName);

        debug(
          "mapped %s %s -> %s",
          requestMethod.toUpperCase(),
          openApiPath,
          typeName,
        );
      });

      if (methodMap.size > 0) {
        mapping.set(filePath, methodMap);
      }
    });

    debug("built mapping for %d routes", mapping.size);
  } catch (error) {
    debug("error building type name mapping: %o", error);
    throw error;
  }

  return mapping;
}

/**
 * Checks if a route file needs migration by looking for old-style HTTP_ imports
 * @param {string} content - The file content
 * @returns {boolean}
 */
function needsMigration(content) {
  const methodAlternation = HTTP_METHODS.map((method) =>
    method.toUpperCase(),
  ).join("|");
  const pattern = new RegExp(
    `import\\s+type\\s+\\{[^}]*HTTP_(?:${methodAlternation})[^}]*\\}`,
    "iu",
  );
  return pattern.test(content);
}

/**
 * Updates a single route file with the correct type names
 * @param {string} filePath - Absolute path to the route file
 * @param {Map<string, string>} methodToTypeName - Map of HTTP method to type name
 * @returns {Promise<boolean>} - True if file was updated
 */
async function updateRouteFile(filePath, methodToTypeName) {
  debug("processing route file: %s", filePath);

  let content = await fs.readFile(filePath, "utf8");

  // Check if migration is needed
  if (!needsMigration(content)) {
    debug("file does not need migration: %s", filePath);
    return false;
  }

  let modified = false;

  // Build a map of old type names to new type names found in this file
  const replacements = new Map();

  // Find all import statements with HTTP_ patterns
  const importRegex =
    /import\s+type\s+\{(?<types>[^}]+)\}\s+from\s+["'](?<source>[^"']+)["'];?/gu;
  let importMatch;

  while ((importMatch = importRegex.exec(content)) !== null) {
    const importedTypes = importMatch.groups.types
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    for (const importedType of importedTypes) {
      // Check if this is an HTTP_ type
      const httpMethodMatch = importedType.match(
        new RegExp(`^HTTP_(?<method>${HTTP_METHODS.join("|")})$`, "u"),
      );

      if (httpMethodMatch) {
        const method = httpMethodMatch.groups.method;
        const newTypeName = methodToTypeName.get(method);

        if (newTypeName && newTypeName !== importedType) {
          replacements.set(importedType, newTypeName);
          debug("will replace %s with %s", importedType, newTypeName);
        }
      }
    }
  }

  if (replacements.size === 0) {
    debug("no replacements needed for: %s", filePath);
    return false;
  }

  // Apply replacements
  for (const [oldName, newName] of replacements.entries()) {
    // Replace in import statement
    const importPattern = new RegExp(
      `(import\\s+type\\s+\\{[^}]*\\b)${oldName}(\\b[^}]*\\}\\s+from)`,
      "g",
    );
    content = content.replace(importPattern, `$1${newName}$2`);

    // Replace in export statement (e.g., "export const GET: HTTP_GET")
    // Match the method from the old type name
    const methodMatch = oldName.match(
      new RegExp(`^HTTP_(?<method>${HTTP_METHODS.join("|")})$`, "u"),
    );
    if (methodMatch) {
      const method = methodMatch.groups.method;
      const exportPattern = new RegExp(
        `(export\\s+const\\s+${method}\\s*:\\s*)${oldName}(\\b)`,
        "g",
      );
      content = content.replace(exportPattern, `$1${newName}$2`);
    }

    modified = true;
  }

  if (modified) {
    await fs.writeFile(filePath, content, "utf8");
    debug("updated file: %s", filePath);
  }

  return modified;
}

/**
 * Recursively processes route files in a directory
 * @param {string} routesDir - Path to routes directory
 * @param {string} currentPath - Current subdirectory being processed
 * @param {Map<string, Map<string, string>>} mapping - Type name mapping
 * @returns {Promise<number>} - Number of files updated
 */
async function processRouteDirectory(routesDir, currentPath, mapping) {
  let updatedCount = 0;

  try {
    const entries = await fs.readdir(path.join(routesDir, currentPath), {
      withFileTypes: true,
    });

    for (const entry of entries) {
      const relativePath = path.join(currentPath, entry.name);
      const absolutePath = path.join(routesDir, relativePath);

      if (entry.isDirectory()) {
        // Recursively process subdirectories
        updatedCount += await processRouteDirectory(
          routesDir,
          relativePath,
          mapping,
        );
      } else if (entry.name.endsWith(".ts") && entry.name !== "_.context.ts") {
        // Process TypeScript route files (skip context files)
        const routePath = relativePath
          .replace(/\.ts$/, "")
          .replaceAll("\\", "/");
        const methodMap = mapping.get(routePath);

        if (methodMap) {
          const wasUpdated = await updateRouteFile(absolutePath, methodMap);
          if (wasUpdated) {
            updatedCount++;
          }
        }
      }
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      debug("error processing directory %s: %o", currentPath, error);
    }
  }

  return updatedCount;
}

/**
 * Checks if any route files need migration
 * @param {string} routesDir - Path to routes directory
 * @returns {Promise<boolean>}
 */
async function checkIfMigrationNeeded(routesDir) {
  try {
    const entries = await fs.readdir(routesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.endsWith(".ts") && entry.name !== "_.context.ts") {
        const content = await fs.readFile(
          path.join(routesDir, entry.name),
          "utf8",
        );

        if (needsMigration(content)) {
          return true;
        }
      } else if (entry.isDirectory() && entry.name !== "node_modules") {
        // Recursively check subdirectories
        const subDirPath = path.join(routesDir, entry.name);
        const found = await checkIfMigrationNeeded(subDirPath);
        if (found) {
          return true;
        }
      }
    }
  } catch (error) {
    debug("error checking for migration need: %o", error);
  }

  return false;
}

/**
 * Main migration function - updates route type imports to use new naming convention
 * @param {string} basePath - Base path where routes and types are located
 * @param {string} openApiPath - Path or URL to OpenAPI specification
 * @returns {Promise<boolean>} - True if migration was performed
 */
export async function updateRouteTypes(basePath, openApiPath) {
  debug("starting route type migration for base path: %s", basePath);

  // Skip if running without OpenAPI spec
  if (openApiPath === "_") {
    debug("skipping migration - no OpenAPI spec provided");
    return false;
  }

  const routesDir = path.join(basePath, "routes");

  try {
    // Check if routes directory exists
    await fs.access(routesDir);
  } catch {
    debug("routes directory does not exist: %s", routesDir);
    return false;
  }

  // Quick check if migration is needed
  const migrationNeeded = await checkIfMigrationNeeded(routesDir);

  if (!migrationNeeded) {
    debug("no migration needed - no old-style HTTP_ imports found");
    return false;
  }

  try {
    // Load the OpenAPI specification
    debug("loading OpenAPI specification from: %s", openApiPath);
    const specification = await Specification.fromFile(openApiPath);

    // Build the mapping of paths to type names
    const mapping = await buildTypeNameMapping(specification);

    if (mapping.size === 0) {
      debug("no routes found in specification");
      return false;
    }

    // Process all route files
    debug("processing route files in: %s", routesDir);
    const updatedCount = await processRouteDirectory(routesDir, "", mapping);

    debug("migration complete - updated %d files", updatedCount);
    return updatedCount > 0;
  } catch (error) {
    debug("error during migration: %o", error);
    process.stderr.write(
      `Warning: Could not migrate route types: ${error.message}\n`,
    );
    return false;
  }
}
