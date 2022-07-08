/* eslint-disable max-classes-per-file */
import path from "node:path";
import { write } from "node:fs";
import { stringify } from "node:querystring";

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

class OperationTypeCoder extends Coder {
  name() {
    return `HTTP_${this.requirement.url.split("/").at(-1).toUpperCase()}`;
  }

  write() {
    return "() => { body: string, contentType: number }";
  }
}

class OperationCoder extends Coder {
  name() {
    return this.requirement.url.split("/").at(-1).toUpperCase();
  }

  write(script) {
    return `() => {
      return {}
    }`;
  }

  typeDeclaration(namespace, script) {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .split("~1")
      .at(-1);

    return script.importType(
      new OperationTypeCoder(this.requirement),
      `${pathString}.types.ts`
    );
  }
}

requirement.forEach(([key, pathDefinition]) => {
  pathDefinition.forEach(([, operation]) => {
    repository.get(`paths${key}.ts`).export(new OperationCoder(operation));
  });
});

await repository.writeFiles();

export {};
