import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

export class ResponseTypeCoder extends Coder {
  buildContentObjectType(script, responseCode, response) {
    return `{
      ${Object.keys(response.content ?? {})
        .map(
          (mediaType) =>
            `"${mediaType}": { 
              schema:  ${new SchemaTypeCoder(
                this.requirement
                  .select(responseCode)
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
          ([responseCode, response]) => `${responseCode}: {
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

    return `ResponseBuilderBuilder<${this.buildResponseObjectType(script)}>`;
  }
}
