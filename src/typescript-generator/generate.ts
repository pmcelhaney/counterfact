import { existsSync } from "node:fs";
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

  const HTTP_VERBS = new Set([
    "get",
    "put",
    "post",
    "delete",
    "options",
    "head",
    "patch",
    "trace",
  ]);

  paths.forEach((pathDefinition, key: string) => {
    debug("processing path %s", key);

    const path = key === "/" ? "/index" : key;
    pathDefinition.forEach((operation, requestMethod: string) => {
      if (!HTTP_VERBS.has(requestMethod)) {
        return;
      }

      repository
        .get(`routes${path}.ts`)
        .export(new OperationCoder(operation, requestMethod, securitySchemes));
    });
  });

  debug("telling the repository to write the files to %s", destination);

  await repository.writeFiles(destination, generateOptions);

  debug("finished writing the files");
}
