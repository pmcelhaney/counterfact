import path from "node:path";

import { Repository } from "./repository.js";
import { Specification } from "./specification.js";
import { Coder } from "./coder.js";

const [source, destination] = process.argv
  .slice(2)
  .map((pathString) => path.join(process.cwd(), pathString));

const specification = new Specification(path.dirname(source));

const repository = new Repository();
const requirement = await specification.requirementAt(
  "openapi-example.yaml#/paths"
);

class OperationCoder extends Coder {
  name() {
    return `HTTP_${this.requirement.url.split("/").at(-1).toUpperCase()}`;
  }

  write() {
    return "() => {}";
  }
}

requirement.forEach(([key, pathDefinition]) => {
  pathDefinition.forEach(([, operation]) => {
    repository.get(`paths${key}.ts`).export(new OperationCoder(operation));
  });
});

await Array.from(repository.scripts.entries()).forEach(
  async ([key, script]) => {
    await script.finished();

    console.log("~~~~~~~~~~~~~~~~~~~~~~");
    console.log(`${key}:`);

    console.log(script.contents());
    console.log("~~~~~~~~~~~~~~~~~~~~~~");
  }
);

export {};
