/**
 * Represents a named example defined in an OpenAPI document.
 * Examples can be referenced by route handlers via the `.example(name)` method
 * on the response builder.
 */
export interface Example {
  description: string;
  summary: string;
  value: unknown;
}
