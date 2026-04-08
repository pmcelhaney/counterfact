import Ajv from "ajv";

import type { OpenApiOperation } from "../counterfact-types/index.js";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  coerceTypes: false,
});

export interface ValidationResult {
  errors: string[];
  valid: boolean;
}

function findMissingRequired(
  parameters: NonNullable<OpenApiOperation["parameters"]>,
  location: string,
  values: Record<string, string>,
): string[] {
  return parameters
    .filter((p) => p.in === location && p.required === true)
    .filter((p) => !(p.name in values) || values[p.name] === undefined)
    .map((p) => `${location} parameter '${p.name}' is required`);
}

export function validateRequest(
  operation: OpenApiOperation | undefined,
  request: {
    body: unknown;
    headers: Record<string, string>;
    query: Record<string, string>;
  },
): ValidationResult {
  if (!operation) {
    return { errors: [], valid: true };
  }

  const errors: string[] = [];
  const parameters = operation.parameters ?? [];

  // For query and header parameters, HTTP always delivers values as strings.
  // Only check that required parameters are present; type coercion is handled
  // by the registry before the route handler is called.
  errors.push(...findMissingRequired(parameters, "query", request.query));
  errors.push(...findMissingRequired(parameters, "header", request.headers));

  // Validate request body (OpenAPI 3.x requestBody)
  if (operation.requestBody?.content !== undefined) {
    const schema =
      operation.requestBody.content["application/json"]?.schema ??
      operation.requestBody.content["application/x-www-form-urlencoded"]
        ?.schema;

    if (schema !== undefined) {
      const valid = ajv.validate(schema, request.body);

      if (!valid && ajv.errors) {
        for (const error of ajv.errors) {
          const path = error.instancePath ?? "";

          errors.push(`body${path} ${error.message ?? "is invalid"}`);
        }
      }
    } else if (operation.requestBody.required === true && !request.body) {
      errors.push("body is required");
    }
  }

  // Validate request body (OpenAPI 2.x body parameter)
  const bodyParam = parameters.find((p) => p.in === "body");

  if (bodyParam?.schema !== undefined) {
    const valid = ajv.validate(bodyParam.schema, request.body);

    if (!valid && ajv.errors) {
      for (const error of ajv.errors) {
        const path = error.instancePath ?? "";

        errors.push(`body${path} ${error.message ?? "is invalid"}`);
      }
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}
