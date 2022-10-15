import { Repository } from "./repository.js";
import { Specification } from "./specification.js";
import { OperationCoder } from "./operation-coder.js";

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
}
