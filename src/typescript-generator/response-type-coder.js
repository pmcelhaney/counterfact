import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

export class ResponseTypeCoder extends Coder {
  normalizeStatusCode(statusCode, responses) {
    const definedStatusCodes = Object.keys(responses).filter(
      (key) => key !== "default"
    );

    if (statusCode === "default") {
      if (definedStatusCodes.length === 0) {
        return "[statusCode in HttpStatusCode]";
      }

      return `[statusCode in Exclude<HttpStatusCode, ${definedStatusCodes.join(
        " | "
      )}>]`;
    }

    return statusCode;
  }

  buildContentObjectType(script, statusCode, response) {
    return `{
      ${Object.keys(response.content ?? {})
        .map(
          (mediaType) =>
            `"${mediaType}": { 
              schema:  ${new SchemaTypeCoder(
                this.requirement
                  .get(statusCode)
                  .get("content")
                  .get(mediaType)
                  .get("schema")
              ).write(script)}
            }`
        )
        .join(",\n")}
    }`;
  }

  buildHeaders(script, responseCode) {
    const response = this.requirement.get(responseCode);

    const properties = Object.keys(response.data.headers ?? {}).map(
      (name) =>
        `"${name}": { schema: ${new SchemaTypeCoder(
          response.get("headers").get(name).get("schema")
        ).write(script)}}`
    );

    return `{${properties.join(";")}}`;
  }

  buildResponseObjectType(script) {
    const responses = this.requirement.data;

    return `{
      ${Object.entries(responses)
        .map(
          ([responseCode, response]) => `${this.normalizeStatusCode(
            responseCode,
            responses
          )}: {
          headers: ${this.buildHeaders(script, responseCode)};
          content: ${this.buildContentObjectType(
            script,
            responseCode,
            response
          )};
        }`
        )
        .join(",")}
      }`;
  }

  write(script) {
    script.importExternalType("ResponseBuilderBuilder", "counterfact");
    script.importExternalType("HttpStatusCode", "counterfact");

    return `ResponseBuilderBuilder<${this.buildResponseObjectType(script)}>`;
  }
}
