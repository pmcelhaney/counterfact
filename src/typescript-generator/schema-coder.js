import { Coder } from "./coder.js";

export class SchemaCoder extends Coder {
  name() {
    return `${this.requirement.data.$ref.split("/").at(-1)}Schema`;
  }

  objectSchema(script) {
    return "Record<any, any>";
  }

  arraySchema(script, type) {
    return `Array<${new SchemaCoder(this.requirement.select("items"), 5).write(
      script
    )}>`;
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

    return type;
  }
}
