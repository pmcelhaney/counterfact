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
    return this.requirement
      .get("responses")
      .flatMap((response, responseCode) => {
        const status =
          responseCode === "default"
            ? "number | undefined"
            : Number.parseInt(responseCode, 10);

        if (response.has("content")) {
          return response.get("content").map(
            (content, contentType) => `{  
              status: ${status}, 
              contentType?: "${contentType}",
              body?: ${new SchemaTypeCoder(content.get("schema")).write(script)}
            }`
          );
        }

        if (response.has("schema")) {
          return this.requirement
            .get("produces")
            .data.map(
              (contentType) => `{
            status: ${status},
            contentType?: "${contentType}",
            body?: ${new SchemaTypeCoder(response.get("schema")).write(script)}
          }`
            )
            .join(" | ");
        }

        return `{  
          status: ${status} 
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
        ? "never"
        : new ParametersTypeCoder(parameters, "query").write(script);

    const pathType =
      parameters === undefined
        ? "never"
        : new ParametersTypeCoder(parameters, "path").write(script);

    const headerType =
      parameters === undefined
        ? "never"
        : new ParametersTypeCoder(parameters, "header").write(script);

    const bodyRequirement = this.requirement.get("consumes")
      ? parameters
          .find((parameter) =>
            ["body", "formData"].includes(parameter.get("in").data)
          )
          .get("schema")
      : this.requirement.select("requestBody/content/application~1json/schema");

    const bodyType = bodyRequirement
      ? new SchemaTypeCoder(bodyRequirement).write(script)
      : "undefined";

    const responseType = new ResponseTypeCoder(
      this.requirement.get("responses"),
      this.requirement.get("produces")?.data
    ).write(script);

    return `({ query, path, header, body, context }: { query: ${queryType}, path: ${pathType}, header: ${headerType}, body: ${bodyType}, context: typeof ${contextImportName}, response: ${responseType} }) => ${this.responseTypes(
      script
    )} | { status: 415, contentType: "text/plain", body: string }
    | void`;
  }
}
