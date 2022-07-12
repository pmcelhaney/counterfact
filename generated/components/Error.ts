export type Error = { code: number; message: string };
export const ErrorSchema = {
  type: "object",
  required: ["code", "message"],
  properties: {
    code: { type: "integer", format: "int32" },
    message: { type: "string" },
  },
};
