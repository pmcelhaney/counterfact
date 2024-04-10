/* eslint-disable no-magic-numbers */
import nodePath from "node:path";

import { Coder } from "./coder.js";
import { OperationTypeCoder } from "./operation-type-coder.js";

export class OperationCoder extends Coder {
  constructor(requirement, requestMethod) {
    super(requirement);

    if (requestMethod === undefined) {
      throw new Error("requestMethod is required");
    }

    this.requestMethod = requestMethod;
  }

  names() {
    return super.names(this.requestMethod.toUpperCase());
  }

  write() {
    const responses = this.requirement.get("responses");

    const [firstStatusCode] = responses.map(
      (response, statusCode) => statusCode,
    );
    const [firstResponse] = responses.map((response) => response.data);

    if (!("content" in firstResponse || "schema" in firstResponse)) {
      return `($) => {
        return $.response[${
          firstStatusCode === "default" ? 200 : firstStatusCode
        }];
      }`;
    }

    return `($) => {
      return $.response[${
        firstStatusCode === "default" ? 200 : firstStatusCode
      }].random();
    }`;
  }

  typeDeclaration(namespace, script) {
    const operationTypeCoder = new OperationTypeCoder(
      this.requirement,
      this.requestMethod,
    );

    return script.importType(operationTypeCoder);
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${nodePath
      .join("path", pathString)
      .replaceAll("\\", "/")}.types.ts`;
  }
}
