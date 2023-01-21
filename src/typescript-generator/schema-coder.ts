import { Coder } from "./coder.js";

function scrubSchema(schema) {
  // remove properties that are not valid in JSON Schema 6 and not useful anyway

  const cleaned = { ...schema };

  delete cleaned.example;
  delete cleaned.xml;

  return cleaned;
}

export class SchemaCoder extends Coder {
  public names() {
    return super.names(`${this.requirement.data.$ref.split("/").at(-1)}Schema`);
  }

  private objectSchema(script) {
    const { required, properties } = this.requirement.data;

    const propertyLines = Object.keys(properties ?? {}).map((name) => {
      const schemaCoder = new SchemaCoder(
        this.requirement.select(`properties/${name}`)
      );

      return `"${name}": ${schemaCoder.write(script)}`;
    });

    return `
      {
        type: "object",
        required: ${JSON.stringify(required ?? [])},
        properties: { ${propertyLines.join(", ")} }
      }
    `;
  }

  private arraySchema(script) {
    return `{
        type: "array",     
        items: ${new SchemaCoder(this.requirement.get("items")).write(script)}
      }`;
  }

  private typeDeclaration(script) {
    return script.importExternalType("JSONSchema6", "json-schema");
  }

  public modulePath() {
    return `components/${this.requirement.data.$ref.split("/").at(-1)}.ts`;
  }

  public write(script) {
    if (this.requirement.isReference) {
      return script.import(this);
    }

    const { type } = this.requirement.data;

    if (type === "object") {
      return this.objectSchema(script);
    }

    if (type === "array") {
      return this.arraySchema(script);
    }

    return JSON.stringify(scrubSchema(this.requirement.data));
  }
}
