import nodePath from "node:path";

import { Repository } from "./repository.js";
import { Specification } from "./specification.js";
import { OperationCoder } from "./operation-coder.js";

export async function generate(source, destination) {
  const specification = new Specification(nodePath.dirname(source));

  const repository = new Repository();
  const requirement = await specification.requirementAt(
    `${nodePath.basename(source)}#/paths`
  );

  requirement.forEach(([key, pathDefinition]) => {
    pathDefinition.forEach(([, operation]) => {
      repository.get(`paths${key}.ts`).export(new OperationCoder(operation));
    });
  });

  await repository.writeFiles(destination);
}
