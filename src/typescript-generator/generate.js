import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import nodePath from "node:path";

import createDebug from "debug";

import { ensureDirectoryExists } from "../util/ensure-directory-exists.js";
import { ContextCoder } from "./context-coder.js";
import { OperationCoder } from "./operation-coder.js";
import { Repository } from "./repository.js";
import { Specification } from "./specification.js";

const debug = createDebug("counterfact:typescript-generator:generate");

async function buildCacheDirectory(destination) {
  const gitignorePath = nodePath.join(destination, ".gitignore");
  const cacheReadmePath = nodePath.join(destination, ".cache", "README.md");

  debug("got here");

  await ensureDirectoryExists(gitignorePath);

  debug("got here too");

  if (!existsSync(gitignorePath)) {
    await fs.writeFile(gitignorePath, ".cache\n", "utf8");
  }

  if (!existsSync(cacheReadmePath)) {
    ensureDirectoryExists(cacheReadmePath);
    await fs.writeFile(
      cacheReadmePath,
      "This directory contains compiled JS files from the paths directory. Do not edit these files directly.\n",
      "utf8",
    );
  }
}

// eslint-disable-next-line max-statements
export async function generate(
  source,
  destination,
  repository = new Repository(),
) {
  debug("generating code from %s to %s", source, destination);

  debug("initializing the .cache directory");
  await buildCacheDirectory(destination);
  debug("done initializing the .cache directory");

  debug("creating specification from %s", source);

  const specification = new Specification(source);

  debug("created specification: $o", specification);

  debug("getting reading the #/paths from the specification");

  const paths = await specification.requirementAt("#/paths");

  debug("got %i paths", paths.size);

  paths.forEach((pathDefinition, key) => {
    debug("processing path %s", key);
    pathDefinition.forEach((operation) => {
      repository.get(`paths${key}.ts`).export(new OperationCoder(operation));
    });
  });

  repository.get("paths/$.context.ts").exportDefault(new ContextCoder(paths));

  debug("telling the repository to write the files to %s", destination);

  await repository.writeFiles(destination);

  debug("finished writing the files");
}
