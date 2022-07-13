import type { JSONSchema6 } from "json-schema";
export type ApiResponse = { code: number; type: string; message: string };
export const ApiResponseSchema: JSONSchema6 = {
  type: "object",
  required: [],
  properties: {
    code: { type: "integer", format: "int32" },
    type: { type: "string" },
    message: { type: "string" },
  },
};
