import nodePath from "node:path";

import { SchemaTypeCoder } from "./schema-type-coder.js";
import { TypeCoder } from "./type-coder.js";

export class ParametersTypeCoder extends TypeCoder {
  constructor(requirement, placement) {
    super(requirement);

    this.placement = placement;
  }

  names() {
    return super.names("parameters");
  }

  writeCode(script) {
    const typeDefinitions = (this.requirement?.data ?? [])
      .map((_, index) => {
        return this.requirement.get(index);
      })
      .filter((parameter) => parameter.get("in").data === this.placement)
      .map((parameter) => {
        const name = parameter.get("name")?.data;
        const required = parameter.get("required")?.data;

        const optionalFlag = required ? "" : "?";

        const schema = parameter.has("schema")
          ? parameter.get("schema")
          : parameter;

        return `"${name}"${optionalFlag}: ${new SchemaTypeCoder(schema).write(
          script,
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

    return `${nodePath
      .join("parameters", pathString)
      .replaceAll("\\", "/")}.types.ts`;
  }
}
