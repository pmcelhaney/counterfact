import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

export class ParametersTypeCoder extends Coder {
  constructor(requirement, placement) {
    super(requirement);

    this.placement = placement;
  }

  name() {
    return "parameters";
  }

  write(script) {
    if (!this.requirement) {
      return "undefined";
    }

    const typeDefintions = this.requirement.data
      .filter((parameter) => parameter.in === this.placement)
      .map((parameter, index) => {
        const requirement = this.requirement.select(String(index));

        const { name, required } = parameter;

        const optionalFlag = required ? "" : "?";

        return `${name}${optionalFlag}: ${new SchemaTypeCoder(
          requirement.select("schema")
        ).write(script)}`;
      });

    if (typeDefintions.length === 0) {
      return "never";
    }

    return `{${typeDefintions.join(", ")}}`;
  }
}
