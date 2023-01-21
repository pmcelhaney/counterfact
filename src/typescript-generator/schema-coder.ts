import { Coder } from "./coder.js";
import type { Requirement } from "./requirement.js";
import type { Script } from "./script.js";

interface Schema {
  [key: string]: unknown;
}

function scrubSchema(schema: Schema) {
  // remove properties that are not valid in JSON Schema 6 and not useful anyway

  const cleaned = { ...schema };

  delete cleaned.example;
  delete cleaned.xml;

  return cleaned;
}

export class SchemaCoder extends Coder {
  private readonly requirement: Requirement;

  public names() {
    const componentName = this.requirement.data.$ref?.split("/").at(-1);

    if (componentName === undefined) {
      throw new Error("missing or invalid $ref");
    }

    return super.names(`${componentName}Schema`);
  }

  private objectSchema(script: Script) {
    const { required, properties } = this.requirement.data;

    const propertyLines = Object.keys(properties ?? {}).map((name) => {
      const requirement = this.requirement.select(`properties/${name}`);

      if (requirement === undefined) {
        throw new Error(
          `Could not find a property named ${name}. This technically should not be possible.`
        );
      }
      const schemaCoder = new SchemaCoder(requirement);

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

  private typeDeclaration(script: Script) {
    return script.importExternalType("JSONSchema6", "json-schema");
  }

  public modulePath() {
    return `components/${this.requirement.data.$ref.split("/").at(-1)}.ts`;
  }

  public write(script: Script) {
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
