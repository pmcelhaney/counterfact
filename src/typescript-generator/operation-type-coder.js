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
          : "null";

        return `{  
            status: ${
              type.responseCode === "default"
                ? "number | undefined"
                : Number.parseInt(type.responseCode, 10)
            }, 
          contentType: "${type.contentType}", 
          body: ${body} 
          
        }`;
      })
      .join(" | ");
  }

  write(script) {
    const parameters = this.requirement.select("parameters");
    const queryType =
      parameters === undefined
        ? "undefined"
        : new ParametersTypeCoder(parameters, "query").write(script);

    const pathType =
      parameters === undefined
        ? "undefined"
        : new ParametersTypeCoder(parameters, "path").write(script);

    return `({ query, path, tools }: { query: ${queryType}, path: ${pathType}, tools: ${script.importType(
      new ToolsCoder(),
      "internal/tools.ts"
    )}}) => ${this.responseTypes(
      script
    )} | { status: 415, contentType: "text/plain", body: string }`;
  }
}
