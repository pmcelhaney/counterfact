import { JSONSchema6 } from "json-schema";
export type Tools = {
  oneOf: (array: string[]) => string;
  randomFromSchema: (schema: JSONSchema6) => unknown;
  accepts: (contentType: string) => boolean;
};
