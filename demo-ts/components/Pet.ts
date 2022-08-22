import type { JSONSchema6 } from "json-schema";
import type { Category } from "./Category.js";
import type { Tag } from "./Tag.js";
import { CategorySchema } from "./Category.js";
import { TagSchema } from "./Tag.js";
export type Pet = {
  id: number;
  name: string;
  category: Category;
  photoUrls: Array<string>;
  tags: Array<Tag>;
  status: string;
};
export const PetSchema: JSONSchema6 = {
  type: "object",
  required: ["name", "photoUrls"],
  properties: {
    id: { type: "integer", format: "int64" },
    name: { type: "string" },
    category: CategorySchema,
    photoUrls: {
      type: "array",
      items: { type: "string" },
    },
    tags: {
      type: "array",
      items: TagSchema,
    },
    status: {
      type: "string",
      description: "pet status in the store",
      enum: ["available", "pending", "sold"],
    },
  },
};
