import { printObject, printObjectWithoutQuotes } from "./printers.js";
import { ResponseTypeCoder } from "./response-type-coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { TypeCoder } from "./type-coder.js";

export class ResponsesTypeCoder extends TypeCoder {
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

    return "never";
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
      return "never";
    }

    return printObject(this.buildHeaders(script, response));
  }

  printRequiredHeaders(response) {
    const requiredHeaders = (response.get("headers") ?? [])
      .map((value, name) => ({ name, required: value.data.required }))
      .filter(({ required }) => required)
      .map(({ name }) => `"${name}"`);

    return requiredHeaders.length === 0 ? "never" : requiredHeaders.join(" | ");
  }

  buildResponseObjectType(script) {
    return printObjectWithoutQuotes(
      this.requirement.map((response, responseCode) => [
        this.normalizeStatusCode(responseCode),
        new ResponseTypeCoder(response, this.openApi2MediaTypes).write(script),
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
