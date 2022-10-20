import nodePath from "node:path";

import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { printObject, printObjectWithoutQuotes } from "./printers.js";

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
    if (response.has("content")) {
      return response.get("content").map((content, mediaType) => [
        mediaType,
        `{ 
            schema:  ${new SchemaTypeCoder(content.get("schema")).write(script)}
         }`,
      ]);
    }

    return "{}";
  }

  printContentObjectType(script, response) {
    if (!response.has("content")) {
      return "{}";
    }

    return printObject(this.buildContentObjectType(script, response));
  }

  buildHeaders(script, response) {
    return response
      .get("headers")
      .map((value, name) => [
        name,
        `{ schema: ${new SchemaTypeCoder(value.get("schema") ?? value).write(
          script
        )}}`,
      ]);
  }

  printHeaders(script, response) {
    if (!response.has("headers")) {
      return "{}";
    }

    return printObject(this.buildHeaders(script, response));
  }

  buildResponseObjectType(script) {
    return printObjectWithoutQuotes(
      this.requirement.map((response, responseCode) => [
        this.normalizeStatusCode(responseCode),
        `{
          headers: ${this.printHeaders(script, response)};
          content: ${this.printContentObjectType(script, response)};
        }`,
      ])
    );
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
