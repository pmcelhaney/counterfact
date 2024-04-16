import { printObjectWithoutQuotes } from "./printers.js";
import { ResponseTypeCoder } from "./response-type-coder.js";
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

  buildResponseObjectType(script) {
    return printObjectWithoutQuotes(
      this.requirement.map((response, responseCode) => [
        this.normalizeStatusCode(responseCode),
        new ResponseTypeCoder(response, this.openApi2MediaTypes).write(script),
      ]),
    );
  }

  writeCode(script) {
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
