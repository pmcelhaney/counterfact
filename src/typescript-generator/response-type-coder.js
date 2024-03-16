import { Coder } from "./coder.js";
import { printObject, printObjectWithoutQuotes } from "./printers.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

export class ResponseTypeCoder extends Coder {
  constructor(requirement, openApi2MediaTypes = []) {
    super(requirement);

    this.openApi2MediaTypes = openApi2MediaTypes;
  }

  typeForDefaultStatusCode(listedStatusCodes) {
    const definedStatusCodes = listedStatusCodes.filter(
      (key) => key !== "default",
    );

    if (definedStatusCodes.length === 0) {
      return "[statusCode in HttpStatusCode]";
    }

    return `[statusCode in Exclude<HttpStatusCode, ${definedStatusCodes.join(
      " | ",
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

    return this.openApi2MediaTypes.map((mediaType) => [
      mediaType,
      `{
            schema: ${new SchemaTypeCoder(response.get("schema")).write(script)}
         }`,
    ]);
  }

  printContentObjectType(script, response) {
    if (response.has("content") || response.has("schema")) {
      return printObject(this.buildContentObjectType(script, response));
    }

    return "{}";
  }

  buildHeaders(script, response) {
    return response
      .get("headers")
      .map((value, name) => [
        name,
        `{ schema: ${new SchemaTypeCoder(value.get("schema") ?? value).write(
          script,
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
      ]),
    );
  }

  write(script) {
    script.importSharedType("ResponseBuilderFactory");

    const text = `ResponseBuilderFactory<${this.buildResponseObjectType(
      script,
    )}>`;

    if (text.includes("HttpStatusCode")) {
      script.importSharedType("HttpStatusCode");
    }

    return text;
  }
}
