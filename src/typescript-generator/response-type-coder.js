import nodePath from "node:path";

import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

export class ResponseTypeCoder extends Coder {
  typeForDefaultStatusCode(listedStatusCodes) {
    const definedStatusCodes = listedStatusCodes.filter(
      (key) => key !== "default"
    );

    if (definedStatusCodes.length === 0) {
      return "[statusCode in HttpStatusCode]";
    }

    return `[statusCode in Exclude<HttpStatusCode, ${definedStatusCodes.join(
      " | "
    )}>]`;
  }

  normalizeStatusCode(statusCode, responses) {
    if (statusCode === "default") {
      return this.typeForDefaultStatusCode(Object.keys(responses));
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
    const basePath = script.path
      .split("/")
      .slice(0, -1)
      .map(() => "..")
      .join("/");

    script.importExternalType(
      "ResponseBuilderFactory",
      nodePath.join(basePath, "response-builder-factory.js")
    );
    script.importExternalType(
      "HttpStatusCode",
      nodePath.join(basePath, "response-builder-factory.js")
    );

    return `ResponseBuilderFactory<${this.buildResponseObjectType(script)}>`;
  }
}
