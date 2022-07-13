import path from "node:path";

import { Coder } from "./coder.js";
import { ToolsCoder } from "./tools-coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { ParametersTypeCoder } from "./parameters-type-coder.js";

export class OperationTypeCoder extends Coder {
  name() {
    return `HTTP_${this.requirement.url.split("/").at(-1).toUpperCase()}`;
  }

  responseTypes(script) {
    const responses = this.requirement.select("responses");

    return Object.entries(responses.data)
      .flatMap(([responseCode, response]) =>
        Object.entries(response.content ?? { contentType: "null" }).flatMap(
          ([contentType, body]) => ({
            contentType,
            schema: JSON.stringify(body.schema),
            responseCode,
          })
        )
      )
      .map((type) => {
        const schema = responses
          .select(type.responseCode)
          .select("content")
          ?.select(type.contentType.replace("/", "~1"))
          ?.select("schema");

        const body = schema
          ? new SchemaTypeCoder(schema).write(script)
          : undefined;

        const contentTypeLine = body
          ? `contentType?: "${type.contentType}",`
          : "";

        const bodyLine = body ? `body?: ${body}` : "";

        return `{  
            status: ${
              type.responseCode === "default"
                ? "number | undefined"
                : Number.parseInt(type.responseCode, 10)
            }, 
          ${contentTypeLine}
          ${bodyLine}
          
        }`;
      })
      .join(" | ");
  }

  write(script) {
    script.importExternalType(
      "Context",
      path.relative(path.dirname(script.path), "context/context.js")
    );

    const parameters = this.requirement.select("parameters");
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

    const bodyType = new SchemaTypeCoder(
      this.requirement.select("requestBody/content/application~1json/schema")
    ).write(script);

    return `({ query, path, header, body, context, tools }: { query: ${queryType}, path: ${pathType}, header: ${headerType}, body: ${bodyType}, context: Context, tools: ${script.importType(
      new ToolsCoder(),
      "internal/tools.ts"
    )}}) => ${this.responseTypes(
      script
    )} | { status: 415, contentType: "text/plain", body: string }`;
  }
}
