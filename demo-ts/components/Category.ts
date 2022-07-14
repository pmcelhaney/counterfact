import type { JSONSchema6 } from "json-schema";
export type Category = { id: number; name: string };
export const CategorySchema: JSONSchema6 = {
  type: "object",
  required: [],
  properties: {
    id: { type: "integer", format: "int64" },
    name: { type: "string" },
  },
};
