import { Coder } from "./coder.js";

export class ToolsCoder extends Coder {
  get id() {
    return "tools";
  }

  delegate() {
    return Promise.resolve(this);
  }

  names() {
    return super.names("Tools");
  }

  write(script) {
    script.importExternal("JSONSchema6", "json-schema");

    return `
    {
        oneOf: (array: string[]) => string;
        randomFromSchema: (schema: JSONSchema6 ) => unknown;
        accepts: (contentType: string) => boolean;
    }`;
  }

  modulePath() {
    return "internal/tools.ts";
  }
}
