import nodePath from "node:path";

import { buildJsDoc } from "./jsdoc.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { TypeCoder } from "./type-coder.js";
import type { Requirement } from "./requirement.js";
import type { Script } from "./script.js";

export class ParametersTypeCoder extends TypeCoder {
  public placement: string;

  public constructor(requirement: Requirement, placement: string) {
    super(requirement);

    this.placement = placement;
  }

  public override names(): Generator<string> {
    return super.names("parameters");
  }

  public override writeCode(script: Script): string {
    const typeDefinitions = (
      (this.requirement?.data as unknown as unknown[]) ?? []
    )
      .map((_, index) => {
        return this.requirement.get(index)!;
      })
      .filter(
        (parameter) =>
          (parameter.get("in")!.data as unknown as string) === this.placement,
      )
      .map((parameter) => {
        const name = parameter.get("name")?.data as string | undefined;
        const required = parameter.get("required")?.data as boolean | undefined;

        const optionalFlag = required ? "" : "?";

        const schema = parameter.has("schema")
          ? parameter.get("schema")!
          : parameter;

        const comment = buildJsDoc(parameter.data);
        const commentPrefix = comment ? `\n${comment}` : "";

        const typeString = new SchemaTypeCoder(schema).write(script);

        return `${commentPrefix}"${name}"${optionalFlag}: ${typeString}`;
      });

    if (typeDefinitions.length === 0) {
      return "never";
    }

    return `{${typeDefinitions.join(", ")}}`;
  }

  public override modulePath(): string {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)!
      .replaceAll("~1", "/");

    return `${nodePath
      .join("parameters", pathString)
      .replaceAll("\\", "/")}.types.ts`;
  }
}
