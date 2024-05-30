import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath from "node:path";

import createDebug from "debug";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { OperationCoder } from "./operation-coder.js";
import { Repository } from "./repository.js";
import { Specification } from "./specification.js";

const debug = createDebug("counterfact:typescript-generator:generate");

async function buildCacheDirectory(destination) {
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

async function getPathsFromSpecification(specification) {
  try {
    return (await specification.requirementAt("#/paths")) ?? new Set();
  } catch (error) {
    process.stderr.write(
      `Could not find #/paths in the specification.\n${error}\n`,
    );

    return new Set();
  }
}

// eslint-disable-next-line max-statements, max-params
export async function generate(
  source,
  destination,
  generateOptions,
  repository = new Repository(),
) {
  debug("generating code from %s to %s", source, destination);

  debug("initializing the .cache directory");
  await buildCacheDirectory(destination);
  debug("done initializing the .cache directory");

  debug("creating specification from %s", source);

  const specification = new Specification(source);

  debug("created specification: $o", specification);

  debug("reading the #/paths from the specification");

  const paths = await getPathsFromSpecification(specification);

  debug("got %i paths", paths.size);

  const securityRequirement = await specification.requirementAt(
    "#/components/securitySchemes",
  );

  const securitySchemes = Object.values(securityRequirement?.data ?? {});

  paths.forEach((pathDefinition, key) => {
    debug("processing path %s", key);

    pathDefinition.forEach((operation, requestMethod) => {
      repository
        .get(`routes${key}.ts`)
        .export(new OperationCoder(operation, requestMethod, securitySchemes));
    });
  });

  debug("telling the repository to write the files to %s", destination);

  await repository.writeFiles(destination, generateOptions);

  debug("finished writing the files");
}
