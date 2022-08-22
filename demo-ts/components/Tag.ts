import type { JSONSchema6 } from "json-schema";
export type Tag = { id: number; name: string };
export const TagSchema: JSONSchema6 = {
  type: "object",
  required: [],
  properties: {
    id: { type: "integer", format: "int64" },
    name: { type: "string" },
  },
};
