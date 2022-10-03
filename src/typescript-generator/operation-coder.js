/* eslint-disable no-magic-numbers */
import nodePath from "node:path";

import { Coder } from "./coder.js";
import { OperationTypeCoder } from "./operation-type-coder.js";

export class OperationCoder extends Coder {
  requestMethod() {
    return this.requirement.url.split("/").at(-1).toUpperCase();
  }

  names() {
    return super.names(this.requestMethod());
  }

  write() {
    const responses = this.requirement.get("responses");

    const [firstStatusCode] = responses.map(([statusCode]) => statusCode);
    const [firstResponse] = responses.map(([, response]) => response.data);

    if (!("content" in firstResponse)) {
      return "() => { /* no response content specified in the OpenAPI document */ }";
    }

    return `($) => {
      return $.response[${
        firstStatusCode === "default" ? 200 : firstStatusCode
      }].random();
    }`;
  }

  typeDeclaration(namespace, script) {
    const operationTypeCoder = new OperationTypeCoder(this.requirement);

    return script.importType(operationTypeCoder);
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${nodePath.join("path", pathString)}.types.ts`;
  }
}
