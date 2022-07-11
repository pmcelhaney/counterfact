import { Coder } from "./coder.js";
import { SchemaCoder } from "./schema-coder.js";
import { OperationTypeCoder } from "./operation-type-coder.js";

export class OperationCoder extends Coder {
  name() {
    return this.requirement.url.split("/").at(-1).toUpperCase();
  }

  write(script) {
    const responses = this.requirement.select("responses");

    const returns = responses.map(([statusCode, response]) => {
      if (statusCode === "default") {
        return this.responseForStatusCode(script, response);
      }

      return `if (statusCode === "${statusCode}") { 
        ${this.responseForStatusCode(script, response, statusCode)}
      }`;
    });

    const statusCodes = responses.map(([statusCode]) => statusCode);

    return `({ tools }) => {
      const statusCode = tools.oneOf(${JSON.stringify(statusCodes)});

      ${returns.join("\n")}

      return {
        statusCode: "415",
        body: "HTTP 415: Unsupported Media Type",
      }
    }`;
  }

  responseForStatusCode(script, response, statusCode) {
    const returns = (response.select("content") || []).map(
      ([contentType, responseForContentType]) => this.responseForContentType(
        statusCode,
        contentType,
        responseForContentType,
        script
      )
    );

    return returns.join("\n");
  }

  responseForContentType(statusCode, contentType, response, script) {
    const statusLine = statusCode === undefined ? "" : `status: "${statusCode}",`;

    const exampleKeys = Object.keys(response.select("examples")?.data ?? {});
    const examples = (response.select("examples") || []).map(
      ([name, example]) => `if (example === "${name}") { 
          
            return {
              ${statusLine}
              contentType: "${contentType}",
              body: ${JSON.stringify(example.select("value").data)}
            }
        }`
    );

    return `if (tools.accepts("${contentType}")) { 
      const example = tools.oneOf(${JSON.stringify(exampleKeys)});

      ${examples.join("\n")}

      return {
        ${statusLine}
        contentType: "${contentType}",
        body: tools.randomFromSchema(${new SchemaCoder(
      response.select("schema")
    ).write(script)})
      };
    }`;
  }

  typeDeclaration(namespace, script) {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .split("~1")
      .at(-1);

    return script.importType(
      new OperationTypeCoder(this.requirement),
      `${pathString}.types.ts`
    );
  }
}
