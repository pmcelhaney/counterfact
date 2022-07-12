import { Coder } from "./coder.js";

export class SchemaCoder extends Coder {
  name() {
    return `${this.requirement.data.$ref.split("/").at(-1)}Schema`;
  }

  write(script) {
    if (this.requirement.isReference) {
      return script.import(
        this,
        `components/${this.requirement.data.$ref.split("/").at(-1)}.ts`
      );
    }

    return JSON.stringify(this.requirement.data);
  }
}
