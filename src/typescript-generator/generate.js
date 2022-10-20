import fs from "node:fs/promises";
import nodePath from "node:path";

import { Repository } from "./repository.js";
import { Specification } from "./specification.js";
import { OperationCoder } from "./operation-coder.js";

// eslint-disable-next-line no-underscore-dangle
const __dirname = nodePath.dirname(new URL(import.meta.url).pathname);

export async function generate(
  source,
  destination,
  repository = new Repository()
) {
  const specification = new Specification();

  const requirement = await specification.requirementAt(`${source}#/paths`);

  requirement.forEach((pathDefinition, key) => {
    pathDefinition.forEach((operation) => {
      repository.get(`paths${key}.ts`).export(new OperationCoder(operation));
    });
  });

  await repository.writeFiles(destination);

  fs.copyFile(
    nodePath.join(__dirname, "../../templates/response-builder-factory.ts"),
    nodePath.join(destination, "response-builder-factory.ts")
  );
}
