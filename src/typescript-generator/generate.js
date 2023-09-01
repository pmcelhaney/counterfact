import createDebug from "debug";

import { OperationCoder } from "./operation-coder.js";
import { Repository } from "./repository.js";
import { Specification } from "./specification.js";

const debug = createDebug("counterfact:typescript-generator:generate");

// eslint-disable-next-line max-statements
export async function generate(
  source,
  destination,
  repository = new Repository(),
) {
  debug("generating code from %s to %s", source, destination);

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

  debug("telling the repository to write the files to %s", destination);

  await repository.writeFiles(destination);

  debug("finished writing the files");
}
