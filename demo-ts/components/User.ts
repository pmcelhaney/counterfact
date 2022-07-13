import type { JSONSchema6 } from "json-schema";
export type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userStatus: number;
};
export const UserSchema: JSONSchema6 = {
  type: "object",
  required: [],
  properties: {
    id: { type: "integer", format: "int64" },
    username: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: { type: "string" },
    password: { type: "string" },
    phone: { type: "string" },
    userStatus: {
      type: "integer",
      format: "int32",
      description: "User Status",
    },
  },
};
