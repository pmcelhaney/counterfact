import type { JSONSchema6 } from "json-schema";
export type Order = {
  id: number;
  petId: number;
  quantity: number;
  shipDate: string;
  status: string;
  complete: boolean;
};
export const OrderSchema: JSONSchema6 = {
  type: "object",
  required: [],
  properties: {
    id: { type: "integer", format: "int64" },
    petId: { type: "integer", format: "int64" },
    quantity: { type: "integer", format: "int32" },
    shipDate: { type: "string", format: "date-time" },
    status: {
      type: "string",
      description: "Order Status",
      enum: ["placed", "approved", "delivered"],
    },
    complete: { type: "boolean" },
  },
};
