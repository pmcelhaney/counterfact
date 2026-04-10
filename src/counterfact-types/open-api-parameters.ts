/**
 * Describes a single parameter (path, query, header, cookie, body, or
 * formData) as defined in an OpenAPI document. Used internally to type the
 * `path`, `query`, `headers`, and `body` properties of a route handler's
 * argument object.
 */
export interface OpenApiParameters {
  in: "body" | "cookie" | "formData" | "header" | "path" | "query";
  name: string;
  required?: boolean;
  schema?: {
    [key: string]: unknown;
    type?: string;
  };
  type?: "string" | "number" | "integer" | "boolean";
}
