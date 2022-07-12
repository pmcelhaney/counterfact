export type Pet = { id: number; name: string; tag: string };
export const PetSchema = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: { type: "integer", format: "int64" },
    name: { type: "string" },
    tag: { type: "string" },
  },
};
