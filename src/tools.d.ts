import { JSONSchema6Type } from "json-schema";

export type Tools = {
    oneOf: (array: string[]) => string;
    randomFromSchema: (schema: JSONSchema6Type ) => unknown;
    accepts: (contentType: string) => boolean;
}
 