import { Coder } from "./coder.js";

export class ToolsCoder extends Coder {
  id() {
    return "tools";
  }

  delegate() {
    return Promise.resolve(this);
  }

  name() {
    return "Tools";
  }

  write(script) {
    script.importExternal("JSONSchema6Type", "json-schema");

    return `
    {
        oneOf: (array: string[]) => string;
        randomFromSchema: (schema: JSONSchema6Type ) => unknown;
        accepts: (contentType: string) => boolean;
    }`;
  }
}
