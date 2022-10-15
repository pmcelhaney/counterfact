import nodePath from "node:path";

import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

function printObjectFromEntries(entries) {
  return `{\n${entries
    .map(([key, value]) => `"${key}": ${value}`)
    .join(",\n")}\n}`;
}

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

  normalizeStatusCode(statusCode) {
    if (statusCode === "default") {
      return this.typeForDefaultStatusCode(Object.keys(this.requirement.data));
    }

    return statusCode;
  }

  buildContentObjectType(script, response) {
    if (!response.has("content")) {
      return "{}";
    }

    const entries = response.get("content").map((content, mediaType) => [
      mediaType,
      `{ 
          schema:  ${new SchemaTypeCoder(content.get("schema")).write(script)}
       }`,
    ]);

    return printObjectFromEntries(entries);
  }

  buildHeaders(script, response) {
    if (!response.has("headers")) {
      return "{}";
    }

    const entries = response
      .get("headers")
      .map((value, name) => [
        name,
        `{ schema: ${new SchemaTypeCoder(value.get("schema")).write(script)}}`,
      ]);

    return printObjectFromEntries(entries);
  }

  buildResponseObjectType(script) {
    return `{
      ${this.requirement
        .map(
          (response, responseCode) => `${this.normalizeStatusCode(
            responseCode
          )}: {
          headers: ${this.buildHeaders(script, response)};
          content: ${this.buildContentObjectType(script, response)};
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
