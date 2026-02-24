import nodePath from "node:path";

import { CONTEXT_FILE_TOKEN } from "./context-file-token.js";
import { ParametersTypeCoder } from "./parameters-type-coder.js";
import { READ_ONLY_COMMENTS } from "./read-only-comments.js";
import { ResponsesTypeCoder } from "./responses-type-coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { TypeCoder } from "./type-coder.js";
import { ParameterExportTypeCoder } from "./parameter-export-type-coder.js";

export class OperationTypeCoder extends TypeCoder {
  constructor(requirement, requestMethod, securitySchemes = []) {
    super(requirement);

    if (requestMethod === undefined) {
      throw new Error("requestMethod is required");
    }

    this.requestMethod = requestMethod;
    this.securitySchemes = securitySchemes;
  }

  getOperationBaseName() {
    const operationId = this.requirement.get("operationId")?.data;

    return operationId || `HTTP_${this.requestMethod.toUpperCase()}`;
  }

  names() {
    return super.names(`HTTP_${this.requestMethod.toUpperCase()}`);
  }

  exportParameterType(script, parameterKind, inlineType, baseName, modulePath) {
    if (inlineType === "never") {
      return "never";
    }

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
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

  responseTypes(script) {
    return this.requirement
      .get("responses")
      .flatMap((response, responseCode) => {
        const status =
          responseCode === "default"
            ? "number | undefined"
            : Number.parseInt(responseCode, 10);

        if (response.has("content")) {
          return response.get("content").map(
            (content, contentType) => `{  
              status: ${status}, 
              contentType?: "${contentType}",
              body?: ${new SchemaTypeCoder(content.get("schema")).write(script)}
            }`,
          );
        }

        if (response.has("schema")) {
          const produces =
            this.requirement?.get("produces")?.data ??
            this.requirement.specification.rootRequirement.get("produces").data;

          return produces
            .map(
              (contentType) => `{
            status: ${status},
            contentType?: "${contentType}",
            body?: ${new SchemaTypeCoder(response.get("schema")).write(script)}
          }`,
            )
            .join(" | ");
        }

        return `{  
          status: ${status} 
        }`;
      })

      .join(" | ");
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${nodePath
      .join("types/paths", pathString === "/" ? "/index" : pathString)
      .replaceAll("\\", "/")}.types.ts`;
  }

  userType() {
    if (
      this.securitySchemes.some(
        ({ scheme, type }) => type === "http" && scheme === "basic",
      )
    ) {
      return "{username?: string, password?: string}";
    }

    return "never";
  }

  writeCode(script) {
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

    const queryType = new ParametersTypeCoder(parameters, "query").write(
      script,
    );

    const pathType = new ParametersTypeCoder(parameters, "path").write(script);

    const headersType = new ParametersTypeCoder(parameters, "header").write(
      script,
    );

    const bodyRequirement =
      this.requirement.get("consumes") ||
      this.requirement.specification?.rootRequirement?.get("consumes")
        ? parameters
            ?.find((parameter) =>
              ["body", "formData"].includes(parameter.get("in").data),
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
      this.requirement.get("responses"),
      this.requirement.get("produces")?.data ??
        this.requirement.specification?.rootRequirement?.get("produces")?.data,
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

    return `($: OmitValueWhenNever<{ query: ${queryTypeName}, path: ${pathTypeName}, headers: ${headersTypeName}, body: ${bodyType}, context: ${contextTypeImportName}, response: ${responseType}, x: ${xType}, proxy: ${proxyType}, user: ${this.userType()}, delay: ${delayType} }>) => MaybePromise<${this.responseTypes(
      script,
    )} | { status: 415, contentType: "text/plain", body: string } | COUNTERFACT_RESPONSE | { ALL_REMAINING_HEADERS_ARE_OPTIONAL: COUNTERFACT_RESPONSE }>`;
  }
}
