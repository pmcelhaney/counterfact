import nodePath from "node:path";

import { toForwardSlashPath } from "../util/forward-slash-path.js";
import { CONTEXT_FILE_TOKEN } from "./context-file-token.js";
import { buildJsDoc } from "./jsdoc.js";
import { ParameterExportTypeCoder } from "./parameter-export-type-coder.js";
import { ParametersTypeCoder } from "./parameters-type-coder.js";
import { READ_ONLY_COMMENTS } from "./read-only-comments.js";
import { RESERVED_WORDS } from "./reserved-words.js";
import { ResponsesTypeCoder } from "./responses-type-coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { TypeCoder } from "./type-coder.js";
import type { Requirement } from "./requirement.js";
import type { Script } from "./script.js";

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#reserved_words

function sanitizeIdentifier(value: string): string {
  // Treat any run of non-identifier characters as a camelCase separator
  let result = value.replaceAll(/[^\w$]+(?<next>.)/gu, (_, char: string) =>
    char.toUpperCase(),
  );

  // Strip any trailing non-identifier characters (no following char to capitalize)
  result = result.replaceAll(/[^\w$]/gu, "");

  // If the identifier starts with a digit, prefix with an underscore
  if (/^\d/u.test(result)) {
    result = `_${result}`;
  }

  // If the identifier is a reserved word, append an underscore
  if (RESERVED_WORDS.has(result)) {
    result = `${result}_`;
  }

  return result || "_";
}

export interface SecurityScheme {
  scheme?: string;
  type?: string;
}

/**
 * Generates the TypeScript type for a single OpenAPI operation.
 *
 * The emitted type describes the function signature that a Counterfact route
 * handler must satisfy, including strongly-typed `query`, `path`, `headers`,
 * `cookie`, `body`, `context`, `response`, and `user` arguments.
 *
 * Output is written to `types/paths/<route>.types.ts`.
 */
export class OperationTypeCoder extends TypeCoder {
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

  /**
   * Returns the base identifier for this operation, derived from its
   * `operationId` (sanitised) or falling back to `HTTP_<METHOD>`.
   */
  public getOperationBaseName(): string {
    const operationId = this.requirement.get("operationId")?.data as
      | string
      | undefined;

    return operationId
      ? sanitizeIdentifier(operationId)
      : `HTTP_${this.requestMethod.toUpperCase()}`;
  }

  public override jsdoc(): string {
    return buildJsDoc(this.requirement.data);
  }

  public override names(): Generator<string> {
    return super.names(this.getOperationBaseName());
  }

  /**
   * Generates and exports a named parameter type (e.g. `ListPets_Query`) from
   * `modulePath` and returns the exported type name.
   *
   * Returns `"never"` without creating an export when `inlineType` is
   * `"never"`.
   *
   * @param script - The script being assembled.
   * @param parameterKind - `"query"`, `"path"`, `"headers"`, or `"cookie"`.
   * @param inlineType - The inline TypeScript type string to export.
   * @param baseName - The base identifier prefix for the exported type name.
   * @param modulePath - The repository-relative path of the type file.
   */
  public exportParameterType(
    script: Script,
    parameterKind: string,
    inlineType: string,
    baseName: string,
    modulePath: string,
  ): string {
    if (inlineType === "never") {
      return "never";
    }

    const capitalize = (str: string): string =>
      str.charAt(0).toUpperCase() + str.slice(1);
    const typeName = `${baseName}_${capitalize(parameterKind)}`;

    const coder = new ParameterExportTypeCoder(
      this.requirement,
      typeName,
      inlineType,
      parameterKind,
    );
    coder._modulePath = modulePath;

    return script.export(coder, true);
  }

  /**
   * Returns the union of all possible response type shapes for this operation.
   *
   * @param script - The script being assembled (used to resolve imports).
   */
  public responseTypes(script: Script): string {
    return this.requirement
      .get("responses")!
      .flatMap((response, responseCode): string | string[] => {
        const status =
          responseCode === "default"
            ? "number | undefined"
            : Number.parseInt(responseCode, 10);

        if (response.has("content")) {
          return response.get("content")!.map(
            (content, contentType) => `{  
              status: ${status}, 
              contentType?: "${contentType}",
              body?: ${content.has("schema") ? new SchemaTypeCoder(content.get("schema")!).write(script) : "unknown"}
            }`,
          );
        }

        if (response.has("schema")) {
          const producesReq =
            this.requirement?.get("produces") ??
            this.requirement.specification?.rootRequirement?.get("produces");
          const produces = producesReq?.data as string[] | undefined;

          if (produces) {
            return produces
              .map(
                (contentType) => `{
            status: ${status},
            contentType?: "${contentType}",
            body?: ${new SchemaTypeCoder(response.get("schema")!).write(script)}
          }`,
              )
              .join(" | ");
          }
        }

        return `{  
          status: ${status} 
        }`;
      })

      .join(" | ");
  }

  public override modulePath(): string {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)!
      .replaceAll("~1", "/");

    return `${toForwardSlashPath(
      nodePath.join("types/paths", pathString === "/" ? "/index" : pathString),
    )}.types.ts`;
  }

  /**
   * Returns the TypeScript type for the `user` argument.
   *
   * When the operation is protected by HTTP Basic auth, the type is
   * `{username?: string, password?: string}`.  Otherwise it is `"never"`.
   */
  public userType(): string {
    if (
      this.securitySchemes.some(
        ({ scheme, type }) => type === "http" && scheme === "basic",
      )
    ) {
      return "{username?: string, password?: string}";
    }

    return "never";
  }

  public override writeCode(script: Script): string {
    script.comments = READ_ONLY_COMMENTS;

    const xType = script.importSharedType("WideOperationArgument");

    script.importSharedType("OmitValueWhenNever");
    script.importSharedType("MaybePromise");
    script.importSharedType("COUNTERFACT_RESPONSE");

    const contextTypeImportName = script.importExternalType(
      "Context",
      CONTEXT_FILE_TOKEN,
    );

    const parameters = this.requirement.get("parameters");

    const queryType = new ParametersTypeCoder(parameters!, "query").write(
      script,
    );

    const pathType = new ParametersTypeCoder(parameters!, "path").write(script);

    const headersType = new ParametersTypeCoder(parameters!, "header").write(
      script,
    );

    const cookieType = new ParametersTypeCoder(parameters!, "cookie").write(
      script,
    );

    const bodyRequirement =
      (this.requirement.get("consumes") ??
      this.requirement.specification?.rootRequirement?.get("consumes"))
        ? parameters
            ?.find((parameter) =>
              ["body", "formData"].includes(
                parameter.get("in")?.data as unknown as string,
              ),
            )
            ?.get("schema")
        : this.requirement.select(
            "requestBody/content/application~1json/schema",
          );

    const bodyType =
      bodyRequirement === undefined
        ? "never"
        : new SchemaTypeCoder(bodyRequirement).write(script);

    const responseType = new ResponsesTypeCoder(
      this.requirement.get("responses")!,
      (this.requirement.get("produces")?.data ??
        this.requirement.specification?.rootRequirement?.get("produces")
          ?.data) as string[] | undefined,
    ).write(script);

    const proxyType = "(url: string) => COUNTERFACT_RESPONSE";

    const delayType =
      "(milliseconds: number, maxMilliseconds?: number) => Promise<void>";

    // Get the base name for this operation and export parameter types
    const baseName = this.getOperationBaseName();
    const modulePath = this.modulePath();
    const queryTypeName = this.exportParameterType(
      script,
      "query",
      queryType,
      baseName,
      modulePath,
    );
    const pathTypeName = this.exportParameterType(
      script,
      "path",
      pathType,
      baseName,
      modulePath,
    );
    const headersTypeName = this.exportParameterType(
      script,
      "headers",
      headersType,
      baseName,
      modulePath,
    );

    const cookieTypeName = this.exportParameterType(
      script,
      "cookie",
      cookieType,
      baseName,
      modulePath,
    );

    return `($: OmitValueWhenNever<{ query: ${queryTypeName}, path: ${pathTypeName}, headers: ${headersTypeName}, cookie: ${cookieTypeName}, body: ${bodyType}, context: ${contextTypeImportName}, response: ${responseType}, x: ${xType}, proxy: ${proxyType}, user: ${this.userType()}, delay: ${delayType} }>) => MaybePromise<${this.responseTypes(
      script,
    )} | { status: 415, contentType: "text/plain", body: string } | COUNTERFACT_RESPONSE | { ALL_REMAINING_HEADERS_ARE_OPTIONAL: COUNTERFACT_RESPONSE }>`;
  }
}
