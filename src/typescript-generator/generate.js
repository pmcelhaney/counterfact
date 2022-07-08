/* eslint-disable max-classes-per-file */
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
  `${path.basename(source)}#/paths`
);

class SchemaCoder extends Coder {
  name() {
    return this.requirement.data.$ref.split("/").at(-1);
  }

  write(script) {
    if (script === undefined) {
      throw new Error("script is undefined");
    }

    if (this.requirement.isReference) {
      return script.import(
        this,
        `components/${this.requirement.data.$ref.split("/").at(-1)}.ts`
      );
    }

    return String(JSON.stringify(this.requirement.data));
  }
}

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
    const responses = this.requirement.select("responses");

    const returns = responses.map(([statusCode, response]) => {
      if (statusCode === "default") {
        return this.responseForStatusCode(script, response);
      }

      return `if (statusCode = "${statusCode}") { ${this.responseForStatusCode(
        script,
        response,
        statusCode
      )}}`;
    });

    const statusCodes = Array.from(responses, ([statusCode]) => statusCode);

    return `({ tools }) => {
      const statusCode = tools.oneOf(${JSON.stringify(statusCodes)});

      ${returns.join("\n")}

      return {
        statusCode: "415",
        body: "HTTP 415: Unsupported Media Type",
      }
    }`;
  }

  responseForStatusCode(script, response, statusCode) {
    const returns = Array.from(
      response.select("content"),
      ([contentType, responseForContentType]) => {
        const statusLine =
          statusCode === undefined ? "" : `status: "${statusCode}",`;

        return `if (tools.accepts("${contentType}") { 
        return {
          ${statusLine}
          contentType: "${contentType}",
          body: tools.randomFromSchema(${new SchemaCoder(
            responseForContentType.select("schema")
          ).write(script)});
        }
      }`;
      }
    );

    return returns.join("\n");
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
