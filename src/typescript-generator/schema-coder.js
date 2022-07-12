import { Coder } from "./coder.js";

export class SchemaCoder extends Coder {
  name() {
    return `${this.requirement.data.$ref.split("/").at(-1)}Schema`;
  }

  objectSchema(script) {
    const { required, properties } = this.requirement.data;

    return `
      {
        type: "object",
        required: ${JSON.stringify(required ?? [])},
        properties: { 
          ${Object.entries(properties ?? {}).map(
            ([name, property]) =>
              `"${name}": ${new SchemaCoder(
                this.requirement.select(`properties/${name}`)
              ).write(script)}`
          )} 
        }
      }
    `;
  }

  arraySchema(script) {
    return `{
        type: "array",     
        items: ${new SchemaCoder(this.requirement.select("items")).write(
          script
        )}
      }`;
  }

  typeDeclaration(namespace, script) {
    return script.importExternalType("JSONSchema6Type", "json-schema");
  }

  write(script) {
    if (this.requirement.isReference) {
      return script.import(
        this,
        `components/${this.requirement.data.$ref.split("/").at(-1)}.ts`
      );
    }

    const { type } = this.requirement.data;

    if (type === "object") {
      return this.objectSchema(script);
    }

    if (type === "array") {
      return this.arraySchema(script);
    }

    return JSON.stringify(this.requirement.data);
  }
}
