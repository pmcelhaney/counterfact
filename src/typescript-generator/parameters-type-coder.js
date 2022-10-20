import nodePath from "node:path";

import { Coder } from "./coder.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";

export class ParametersTypeCoder extends Coder {
  constructor(requirement, placement) {
    super(requirement);

    this.placement = placement;
  }

  names() {
    return super.names("parameters");
  }

  write(script) {
    if (!this.requirement) {
      return "undefined";
    }

    const typeDefinitions = this.requirement.data
      .filter((parameter) => parameter.in === this.placement)
      .map((parameter, index) => {
        const requirement = this.requirement.get(String(index));

        const { name, required } = parameter;

        const optionalFlag = required ? "" : "?";

        const schema = requirement.has("schema")
          ? requirement.get("schema")
          : requirement;

        return `${name}${optionalFlag}: ${new SchemaTypeCoder(schema).write(
          script
        )}`;
      });

    if (typeDefinitions.length === 0) {
      return "never";
    }

    return `{${typeDefinitions.join(", ")}}`;
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${nodePath.join("parameters", pathString)}.types.ts`;
  }
}
