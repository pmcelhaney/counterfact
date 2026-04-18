import { pathJoin } from "../util/forward-slash-path.js";
import { buildJsDoc } from "./jsdoc.js";
import { SchemaTypeCoder } from "./schema-type-coder.js";
import { TypeCoder } from "./type-coder.js";
import type { Requirement } from "./requirement.js";
import type { Script } from "./script.js";

export class ParametersTypeCoder extends TypeCoder {
  public placement: string;

  /** Preferred constructor shape: (requirement, version, placement). */
  public constructor(
    requirement: Requirement,
    version: string,
    placement: string,
  );
  public constructor(
    requirement: Requirement,
    versionOrLegacyPlacement = "",
    placement?: string,
  ) {
    const legacyPlacements = new Set(["query", "path", "header", "cookie", ""]);
    const isLegacySignature =
      placement === undefined &&
      arguments.length <= 2 &&
      legacyPlacements.has(versionOrLegacyPlacement);

    let version = versionOrLegacyPlacement;
    let resolvedPlacement = placement ?? "";

    if (isLegacySignature) {
      version = "";
      resolvedPlacement = versionOrLegacyPlacement;
    }

    super(requirement, version);

    this.placement = resolvedPlacement;
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

        const typeString = new SchemaTypeCoder(schema, this.version).write(
          script,
        );

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

    return `${pathJoin("parameters", pathString)}.types.ts`;
  }
}
