import nodePath from "node:path";

import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { ParametersTypeCoder } from "./parameters-type-coder.js";
import { ResponseTypeCoder } from "./response-type-coder.js";
import { ContextCoder } from "./context-coder.js";

export class OperationTypeCoder extends Coder {
  names() {
    return super.names(
      `HTTP_${this.requirement.url.split("/").at(-1).toUpperCase()}`
    );
  }

  responseTypes(script) {
    const responses = this.requirement.get("responses");

    return responses
      .flatMap(([responseCode, response]) => {
        const content = response.get("content");

        if (!content?.data) {
          return [
            {
              contentType: "null",
              responseCode,
            },
          ];
        }

        return content.map(([contentType, body]) => ({
          contentType,
          responseCode,

          schema: body.get("schema"),
        }));
      })
      .map(({ responseCode, contentType, schema }) => {
        const body = schema
          ? new SchemaTypeCoder(schema).write(script)
          : undefined;

        const contentTypeLine = body ? `contentType?: "${contentType}",` : "";

        const bodyLine = body ? `body?: ${body}` : "";

        return `{  
            status: ${
              responseCode === "default"
                ? "number | undefined"
                : Number.parseInt(responseCode, 10)
            }, 
          ${contentTypeLine}
          ${bodyLine}
          
        }`;
      })
      .join(" | ");
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${nodePath.join("path-types", pathString)}.types.ts`;
  }

  write(script) {
    const contextImportName = script.importDefault(
      new ContextCoder(this.requirement)
    );

    const parameters = this.requirement.get("parameters");
    const queryType =
      parameters === undefined
        ? "undefined"
        : new ParametersTypeCoder(parameters, "query").write(script);

    const pathType =
      parameters === undefined
        ? "undefined"
        : new ParametersTypeCoder(parameters, "path").write(script);

    const headerType =
      parameters === undefined
        ? "undefined"
        : new ParametersTypeCoder(parameters, "header").write(script);

    const bodyRequirement = this.requirement.select(
      "requestBody/content/application~1json/schema"
    );

    const bodyType = bodyRequirement
      ? new SchemaTypeCoder(bodyRequirement).write(script)
      : "undefined";

    const responseType = new ResponseTypeCoder(
      this.requirement.get("responses")
    ).write(script);

    return `({ query, path, header, body, context }: { query: ${queryType}, path: ${pathType}, header: ${headerType}, body: ${bodyType}, context: typeof ${contextImportName}, response: ${responseType} }) => ${this.responseTypes(
      script
    )} | { status: 415, contentType: "text/plain", body: string }
    | void`;
  }
}
