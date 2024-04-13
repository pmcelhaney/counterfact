import { Coder } from "./coder.js";

export class TypeCoder extends Coder {
  write(script) {
    if (this.requirement?.isReference) {
      return script.importType(this);
    }

    return this.writeCode(script);
  }
}
