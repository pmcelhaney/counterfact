import { Coder } from "./coder.js";

export class SchemaTypeCoder extends Coder {
  names() {
    return super.names(this.requirement.data.$ref.split("/").at(-1));
  }

  additionalPropertiesType(script) {
    const { additionalProperties, properties } = this.requirement.data;

    if (!additionalProperties.type) {
      return "unknown";
    }

    if (
      Object.values(properties ?? {}).some(
        (property) => property.type !== additionalProperties.type,
      )
    ) {
      return "unknown";
    }

    const requirement = this.requirement.get("additionalProperties");

    return new SchemaTypeCoder(requirement).write(script);
  }

  objectSchema(script) {
    const { data } = this.requirement;

    const properties = Object.keys(data.properties ?? {}).map((name) => {
      const property = this.requirement.get("properties").get(name);

      const isRequired =
        data.required?.includes(name) || property.data.required;
      const optionalFlag = isRequired ? "" : "?";

      return `${name}${optionalFlag}: ${new SchemaTypeCoder(property).write(
        script,
      )}`;
    });

    if (data.additionalProperties) {
      properties.push(
        `[key: string]: ${this.additionalPropertiesType(script)}`,
      );
    }

    return `{${properties.join(",")}}`;
  }

  arraySchema(script) {
    return `Array<${new SchemaTypeCoder(this.requirement.get("items")).write(
      script,
    )}>`;
  }

  writeType(script, type) {
    if (type === "object") {
      return this.objectSchema(script);
    }

    if (type === "array") {
      return this.arraySchema(script);
    }

    if (type === "integer") {
      return "number";
    }

    return type ?? "unknown";
  }

  writeGroup(script, { allOf, anyOf, oneOf }) {
    function matchingKey() {
      if (allOf) {
        return "allOf";
      }

      if (anyOf) {
        return "anyOf";
      }

      return "oneOf";
    }

    const types = (allOf ?? anyOf ?? oneOf).map((item, index) =>
      new SchemaTypeCoder(this.requirement.get(matchingKey()).get(index)).write(
        script,
      ),
    );

    return types.join(allOf ? " & " : " | ");
  }

  writeEnum(script, requirement) {
    return requirement.data
      .map((item) => (typeof item === "string" ? `"${item}"` : item))
      .join(" | ");
  }

  modulePath() {
    return `components/${this.requirement.data.$ref.split("/").at(-1)}.ts`;
  }

  write(script) {
    if (this.requirement.isReference) {
      return script.importType(this);
    }

    const { allOf, anyOf, oneOf, type } = this.requirement.data;

    if (allOf ?? anyOf ?? oneOf) {
      return this.writeGroup(script, { allOf, anyOf, oneOf });
    }

    if (this.requirement.has("enum")) {
      return this.writeEnum(script, this.requirement.get("enum"));
    }

    return this.writeType(script, type);
  }
}
