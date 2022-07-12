import path from "node:path";

import { Repository } from "./repository.js";
import { Specification } from "./specification.js";
import { OperationCoder } from "./operation-coder.js";

const [source, destination] = process.argv
  .slice(2)
  .map((pathString) => path.join(process.cwd(), pathString));

const specification = new Specification(path.dirname(source));

const repository = new Repository();
const requirement = await specification.requirementAt(
  `${path.basename(source)}#/paths`
);

requirement.forEach(([key, pathDefinition]) => {
  pathDefinition.forEach(([, operation]) => {
    repository.get(`paths${key}.ts`).export(new OperationCoder(operation));
  });
});

await repository.writeFiles(destination);

export {};
