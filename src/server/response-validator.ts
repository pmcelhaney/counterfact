import Ajv from "ajv";

import type { OpenApiOperation } from "../counterfact-types/index.js";
import type { CounterfactResponseObject } from "./registry.js";

const ajv = new Ajv({
  allErrors: true,
  strict: false,
  coerceTypes: false,
});

/**
 * Safely reads a string-keyed record value only when the key exists directly on
 * the object itself.
 *
 * This avoids traversing the prototype chain when looking up untrusted keys
 * (for example status/header names parsed from external input).
 *
 * @param record - The record to read from.
 * @param key - Key to check and retrieve.
 * @returns The own-property value for `key`, or `undefined` when absent.
 */
function getOwnRecordValue<T>(
  record: Record<string, T>,
  key: string,
): T | undefined {
  if (!Object.hasOwn(record, key)) {
    return undefined;
  }

  return record[key];
}

export interface ResponseValidationResult {
  errors: string[];
  valid: boolean;
}

export function validateResponse(
  operation: OpenApiOperation | undefined,
  response: CounterfactResponseObject,
): ResponseValidationResult {
  if (!operation) {
    return { errors: [], valid: true };
  }

  const errors: string[] = [];

  const statusKey =
    response.status !== undefined ? String(response.status) : undefined;

  const responseSpec =
    (statusKey !== undefined
      ? getOwnRecordValue(operation.responses, statusKey)
      : undefined) ?? operation.responses.default;

  if (!responseSpec) {
    return { errors: [], valid: true };
  }

  const specHeaders = responseSpec.headers ?? {};
  const actualHeaders = response.headers ?? {};

  for (const [name, headerSpec] of Object.entries(specHeaders)) {
    const headerValue = getOwnRecordValue(actualHeaders, name);
    const actualValue =
      headerValue === undefined
        ? getOwnRecordValue(actualHeaders, name.toLowerCase())
        : headerValue;

    if (headerSpec.required === true && actualValue === undefined) {
      errors.push(`response header '${name}' is required`);
      continue;
    }

    if (actualValue !== undefined && headerSpec.schema !== undefined) {
      const coercedValue =
        typeof actualValue === "string"
          ? coerceHeaderValue(actualValue, headerSpec.schema)
          : actualValue;

      const valid = ajv.validate(headerSpec.schema, coercedValue);

      if (!valid && ajv.errors) {
        for (const error of ajv.errors) {
          const path = error.instancePath ?? "";

          errors.push(
            `response header '${name}'${path} ${error.message ?? "is invalid"}`,
          );
        }
      }
    }
  }

  return {
    errors,
    valid: errors.length === 0,
  };
}

function coerceHeaderValue(
  value: string,
  schema: { [key: string]: unknown },
): unknown {
  const type = schema.type as string | undefined;

  if (type === "integer" || type === "number") {
    const num = Number(value);

    return Number.isNaN(num) ? value : num;
  }

  if (type === "boolean") {
    if (value === "true") return true;
    if (value === "false") return false;

    return value;
  }

  return value;
}
