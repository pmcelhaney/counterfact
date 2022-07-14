import { join } from "node:path";

import { Coder } from "./coder.js";
import { SchemaCoder } from "./schema-coder.js";
import { OperationTypeCoder } from "./operation-type-coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

export class OperationCoder extends Coder {
  requestMethod() {
    return this.requirement.url.split("/").at(-1).toUpperCase();
  }

  names() {
    return super.names(this.requestMethod());
  }

  write(script) {
    const responses = this.requirement.select("responses");

    const returns = responses.map(([statusCode, response]) => {
      if (statusCode === "default") {
        return this.responseForStatusCode(script, response);
      }

      return `if (statusCode === "${statusCode}") { 
        ${this.responseForStatusCode(script, response, statusCode)}
      }`;
    });

    const statusCodes = responses.map(([statusCode]) => statusCode);

    const requestProperties = this.requirement.data.parameters
      ? Array.from(
          new Set(
            this.requirement.data.parameters.map((parameter) => parameter.in)
          )
        )
      : [];

    if (this.requestMethod() !== "GET") {
      requestProperties.push("body");
    }

    requestProperties.push("context", "tools");

    return `({ ${requestProperties.join(", ")} }) => {
      const statusCode = tools.oneOf(${JSON.stringify(statusCodes)});

      ${returns.join("\n")}
 
      return {
        status: 415,
        contentType: "text/plain",
        body: "HTTP 415: Unsupported Media Type",
      }
    }`;
  }

  responseForStatusCode(script, response, statusCode) {
    const returns = (response.select("content") || []).map(
      ([contentType, responseForContentType]) =>
        this.responseForContentType(
          statusCode,
          contentType,
          responseForContentType,
          script
        )
    );

    if (returns.length === 0) {
      return `return {
        status: ${statusCode},
      }`;
    }

    return returns.join("\n");
  }

  responseForContentType(statusCode, contentType, response, script) {
    const statusLine = statusCode === undefined ? "" : `status: ${statusCode},`;

    const exampleKeys = Object.keys(response.select("examples")?.data ?? {});
    const examples = (response.select("examples") || []).map(
      ([name, example]) => `if (example === "${name}") { 
          
            return {
              ${statusLine}
              contentType: "${contentType}",
              body: ${JSON.stringify(example.select("value").data)}
            }
        }`
    );

    const bodyType = new SchemaTypeCoder(response.select("schema")).write(
      script
    );

    const exampleSelector =
      examples.length === 0
        ? ""
        : `const example = tools.oneOf(${JSON.stringify(exampleKeys)});`;

    return `if (tools.accepts("${contentType}")) { 
      ${exampleSelector}

      ${examples.join("\n")}

 

      return {
        ${statusLine}
        contentType: "${contentType}",
        body: tools.randomFromSchema(${new SchemaCoder(
          response.select("schema")
        ).write(script)}) as ${bodyType}
      };
    }`;
  }

  typeDeclaration(namespace, script) {
    const operationTypeCoder = new OperationTypeCoder(this.requirement);

    return script.importType(operationTypeCoder);
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${join("path", pathString)}.types.ts`;
  }
}
