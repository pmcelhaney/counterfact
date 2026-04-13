import nodePath from "node:path";

import { Coder } from "./coder.js";
import {
  OperationTypeCoder,
  type SecurityScheme,
} from "./operation-type-coder.js";
import type { Requirement } from "./requirement.js";
import type { Script } from "./script.js";

/**
 * Generates the default route handler stub for a single OpenAPI operation.
 *
 * The generated stub calls `$.response[statusCode].random()` (or `.empty()`)
 * for the first response defined in the spec.  It is only written when no
 * handler file exists yet — users are expected to replace it with real logic.
 *
 * The corresponding TypeScript type is emitted by {@link OperationTypeCoder}
 * into the `types/paths/…` tree.
 */
export class OperationCoder extends Coder {
  public requestMethod: string;
  public securitySchemes: SecurityScheme[];

  public constructor(
    requirement: Requirement,
    requestMethod: string,
    securitySchemes: SecurityScheme[] = [],
  ) {
    super(requirement);

    if (requestMethod === undefined) {
      throw new Error("requestMethod is required");
    }

    this.requestMethod = requestMethod;
    this.securitySchemes = securitySchemes;
  }

  public override names(): Generator<string> {
    return super.names(this.requestMethod.toUpperCase());
  }

  public override write(): string {
    const responses = this.requirement.get("responses")!;

    const [firstStatusCode] = responses.map(
      (_response, statusCode) => statusCode,
    );
    const [firstResponse] = responses.map(
      (response) => response.data as Record<string, unknown>,
    );

    if (
      firstResponse === undefined ||
      !("content" in firstResponse || "schema" in firstResponse)
    ) {
      return `async ($) => {
        return $.response[${
          firstStatusCode === "default" ? 200 : firstStatusCode
        }].empty();
      }`;
    }

    return `async ($) => {
      return $.response[${
        firstStatusCode === "default" ? 200 : firstStatusCode
      }].random();
    }`;
  }

  public override typeDeclaration(
    _namespace: Map<string, unknown> | undefined,
    script: Script,
  ): string {
    const operationTypeCoder = new OperationTypeCoder(
      this.requirement,
      this.requestMethod,
      this.securitySchemes,
    );

    return script.importType(operationTypeCoder);
  }

  public override modulePath(): string {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)!
      .replaceAll("~1", "/");

    return `${nodePath
      .join("routes", pathString)
      .replaceAll("\\", "/")}.types.ts`;
  }
}
