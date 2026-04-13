import { existsSync, type Dirent } from "node:fs";
import fs from "node:fs/promises";
import nodePath from "node:path";

import createDebug from "debug";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { OperationCoder } from "./operation-coder.js";
import { type SecurityScheme } from "./operation-type-coder.js";
import { pruneRoutes } from "./prune.js";
import { Repository } from "./repository.js";
import { Specification } from "./specification.js";

const debug = createDebug("counterfact:typescript-generator:generate");

interface GenerateOptions {
  prune?: boolean;
  routes?: boolean;
  types?: boolean;
}

/**
 * Initialises the `.cache` directory that holds compiled JS output.
 *
 * Creates a `.gitignore` file that excludes the `.cache` sub-directory and a
 * `README.md` inside `.cache` that explains its purpose.
 *
 * @param destination - The root output directory.
 */
async function buildCacheDirectory(destination: string): Promise<void> {
  const gitignorePath = nodePath.join(destination, ".gitignore");
  const cacheReadmePath = nodePath.join(destination, ".cache", "README.md");

  debug("ensuring the directory containing .gitgnore exists");

  await ensureDirectoryExists(gitignorePath);

  debug("creating the .gitignore file if it doesn't already exist");

  if (!existsSync(gitignorePath)) {
    await fs.writeFile(gitignorePath, ".cache\n", "utf8");
  }

  debug("creating the .cache/README.md file");

  ensureDirectoryExists(cacheReadmePath);
  await fs.writeFile(
    cacheReadmePath,
    "This directory contains compiled JS files from the paths directory. Do not edit these files directly.\n",
    "utf8",
  );
}

/**
 * Reads and returns the `#/paths` requirement from `specification`.
 *
 * Writes a diagnostic message to stderr and returns an empty set when the
 * `paths` key is missing or cannot be read.
 *
 * @param specification - The loaded OpenAPI specification.
 */
async function getPathsFromSpecification(
  specification: Specification,
): Promise<ReturnType<Specification["getRequirement"]>> {
  try {
    return specification.getRequirement("#/paths") ?? new Set<never>();
  } catch (error) {
    process.stderr.write(
      `Could not find #/paths in the specification.\n${error as string}\n`,
    );

    return undefined as unknown as ReturnType<Specification["getRequirement"]>;
  }
}

/**
 * Main code-generation entry point.
 *
 * Loads the OpenAPI spec from `source`, optionally prunes defunct route files,
 * registers all path operations as {@link OperationCoder} exports, and writes
 * the resulting TypeScript files to `destination`.
 *
 * @param source - Path or URL to the OpenAPI document.
 * @param destination - Root directory to write generated files into.
 * @param generateOptions - Controls which artefacts are written (routes, types,
 *   prune).
 * @param repository - Injectable repository instance; defaults to a fresh one
 *   (primarily useful in tests).
 */
export async function generate(
  source: string,
  destination: string,
  generateOptions: GenerateOptions,
  repository = new Repository(),
): Promise<void> {
  debug("generating code from %s to %s", source, destination);

  debug("initializing the .cache directory");
  await buildCacheDirectory(destination);
  debug("done initializing the .cache directory");

  debug("creating specification from %s", source);

  const specification = await Specification.fromFile(source);

  debug("created specification: $o", specification);

  debug("reading the #/paths from the specification");

  const paths = await getPathsFromSpecification(specification);

  debug("got %i paths", paths?.map?.length ?? 0);

  if (generateOptions.prune && generateOptions.routes) {
    debug("pruning defunct route files");
    await pruneRoutes(
      destination,
      paths.map((_v, key) => key),
    );
    debug("done pruning");
  }

  const securityRequirement = specification.getRequirement(
    "#/components/securitySchemes",
  );

  const securitySchemes = Object.values(
    (securityRequirement?.data as Record<string, unknown>) ?? {},
  ) as SecurityScheme[];

  paths.forEach((pathDefinition, key: string) => {
    debug("processing path %s", key);

    const path = key === "/" ? "/index" : key;
    pathDefinition.forEach((operation, requestMethod: string) => {
      repository
        .get(`routes${path}.ts`)
        .export(new OperationCoder(operation, requestMethod, securitySchemes));
    });
  });

  debug("telling the repository to write the files to %s", destination);

  await repository.writeFiles(destination, generateOptions);

  debug("finished writing the files");

  if (generateOptions.types) {
    await writeScenarioContextType(destination);
    await writeDefaultScenariosIndex(destination);
  }
}

interface ContextFileInfo {
  importPath: string;
  alias: string;
  routePath: string;
  depth: number;
}

async function collectContextFiles(
  destination: string,
): Promise<ContextFileInfo[]> {
  const routesDir = nodePath.join(destination, "routes");
  const results: ContextFileInfo[] = [];

  if (!existsSync(routesDir)) {
    return results;
  }

  await walkForContextFiles(routesDir, routesDir, results);
  results.sort((a, b) => b.depth - a.depth);

  return results;
}

async function walkForContextFiles(
  routesDir: string,
  currentDir: string,
  results: ContextFileInfo[],
): Promise<void> {
  let entries: Dirent[];

  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await walkForContextFiles(
        routesDir,
        nodePath.join(currentDir, entry.name),
        results,
      );
    } else if (entry.name === "_.context.ts") {
      const relDir = nodePath
        .relative(routesDir, currentDir)
        .replaceAll("\\", "/");
      const routePath = relDir === "" ? "/" : `/${relDir}`;
      const depth = relDir === "" ? 0 : relDir.split("/").length;
      const importPath =
        relDir === "" ? "../routes/_.context" : `../routes/${relDir}/_.context`;
      const alias = routePathToAlias(routePath);
      results.push({ importPath, alias, routePath, depth });
    }
  }
}

function routePathToAlias(routePath: string): string {
  if (routePath === "/") {
    return "Context";
  }

  return (
    routePath
      .split("/")
      .filter(Boolean)
      .map((seg) =>
        seg
          .replace(/\{(.+?)\}/g, (_match, name: string) =>
            name.replace(/[^a-z0-9]/gi, " "),
          )
          .replace(/[-_\s]([a-z])/g, (_match, c: string) => c.toUpperCase())
          .replace(/^[a-z]/, (c) => c.toUpperCase())
          .replace(/[^a-z0-9]/gi, ""),
      )
      .join("") + "Context"
  );
}

const PARAM_SEGMENT_REGEX = /^\{.+\}$/u;

function buildLoadContextOverload(routePath: string, alias: string): string {
  if (routePath === "/") {
    return '  loadContext(path: "/" | `/${string}`): ' + alias + ";";
  }

  const segments = routePath.split("/").filter(Boolean);
  const hasParam = segments.some((seg) => PARAM_SEGMENT_REGEX.test(seg));

  if (!hasParam) {
    return `  loadContext(path: "${routePath}" | \`${routePath}/\${string}\`): ${alias};`;
  }

  const templatePath = `/${segments
    .map((seg) => (PARAM_SEGMENT_REGEX.test(seg) ? "${string}" : seg))
    .join("/")}`;

  return `  loadContext(path: \`${templatePath}\`): ${alias};`;
}

function buildScenarioContextContent(contextFiles: ContextFileInfo[]): string {
  const rootContext = contextFiles.find((f) => f.routePath === "/");
  const contextType = rootContext
    ? rootContext.alias
    : "Record<string, unknown>";

  const importLines = contextFiles.map(({ importPath, alias }) =>
    alias === "Context"
      ? `import type { Context } from "${importPath}";`
      : `import type { Context as ${alias} } from "${importPath}";`,
  );

  const overloadLines = contextFiles.map(({ alias, routePath }) =>
    buildLoadContextOverload(routePath, alias),
  );

  const parts = [
    "// This file is generated by Counterfact. Do not edit manually.",
    ...importLines,
    "",
    "export interface Scenario$ {",
    '  /** Root context, same as loadContext("/") */',
    `  context: ${contextType};`,
    "  /** Load a context object for a specific path */",
    ...overloadLines,
    "  loadContext(path: string): Record<string, unknown>;",
    "  /** Named route builders stored in the REPL execution context */",
    "  routes: Record<string, unknown>;",
    "  /** Create a new route builder for a given path */",
    "  route: (path: string) => unknown;",
    "}",
    "",
    "/** A scenario function that receives the live REPL environment */",
    "export type Scenario = ($: Scenario$) => Promise<void> | void;",
    "",
  ];

  return parts.join("\n");
}

/**
 * Writes the `types/scenario-context.ts` file, which exports the
 * `Scenario$` interface used to type scenario functions.
 *
 * The interface is generated from all `_.context.ts` files found under the
 * `routes/` directory, providing strongly typed `loadContext()` overloads for
 * every route path that has a context file.
 *
 * @param destination - Root output directory.
 */
export async function writeScenarioContextType(
  destination: string,
): Promise<void> {
  const typesDir = nodePath.join(destination, "types");
  const filePath = nodePath.join(typesDir, "scenario-context.ts");

  const contextFiles = await collectContextFiles(destination);
  const content = buildScenarioContextContent(contextFiles);

  await fs.mkdir(typesDir, { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

const DEFAULT_SCENARIOS_INDEX = `import type { Scenario } from "../types/scenario-context.js";

/**
 * Scenario scripts are plain TypeScript functions that receive the live REPL
 * environment and can read or mutate server state. Run them from the REPL with:
 *   .scenario <functionName>
 */

/**
 * Read or mutate the root context (same object routes see as $.context):
 *   $.context.<property> = <value>;
 *
 * Load a context for a specific path:
 *   const petsCtx = $.loadContext("/pets");
 *
 * Store a pre-configured route builder for later use in the REPL:
 *   $.routes.myRequest = $.route("/pets").method("get");
 */

/**
 * startup() runs automatically when the server initializes, right before the
 * REPL starts. Use it to seed dummy data so the server is ready to use
 * immediately. It receives the same $ argument as all other scenario functions.
 *
 * Tip: delegate to other scenario functions and pass $ along so each function
 * stays focused on a single concern. You can also pass additional arguments to
 * configure them, e.g. addPets($, 20, "dog").
 *
 * If you don't need a startup scenario, delete this function or leave it empty.
 */
export const startup: Scenario = ($) => {
  void $;
};

/**
 * An example scenario. To use it in the REPL, type:
 *   .scenario help
 */
export const help: Scenario = ($) => {
  void $;

  console.log(
    [
      "Scenarios are functions that populate the context object",
      "and / or the REPL environment. They are intended to",
      "populate your environment with specific data and",
      "configurations for testing purposes.",
    ].join("\\n"),
  );

  console.log(
    "\\nScenarios (including this one) are defined in the ./scenarios directory.",
  );
};
`;

async function writeDefaultScenariosIndex(destination: string): Promise<void> {
  const scenariosDir = nodePath.join(destination, "scenarios");
  const filePath = nodePath.join(scenariosDir, "index.ts");

  if (existsSync(filePath)) {
    return;
  }

  await fs.mkdir(scenariosDir, { recursive: true });
  await fs.writeFile(filePath, DEFAULT_SCENARIOS_INDEX, "utf8");
}
