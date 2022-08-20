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
                  .select(statusCode)
                  .select("content")
                  .select(mediaType.replace("/", "~1"))
                  .select("schema")
              ).write(script)}
            }`
        )
        .join(",\n")}
    }`;
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
          headers: {};
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
