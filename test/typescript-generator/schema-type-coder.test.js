import prettier from "prettier";

import { SchemaTypeCoder } from "../../src/typescript-generator/schema-type-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

describe("a SchemaTypeCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({ $ref: "/components/schemas/Example" })
    );

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual([
      "Example",
      "Example2",
      "Example3",
    ]);
  });

  it("when given a $ref, creates an import", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({ $ref: "/components/schemas/Example" })
    );

    const script = {
      importType(c) {
        this.importedCoder = c;

        return "aVariable";
      },
    };

    const result = coder.write(script);

    expect(script.importedCoder).toBe(coder);
    expect(result).toBe("aVariable");
  });

  it.each`
    type         | output
    ${"string"}  | ${"string"}
    ${"number"}  | ${"number"}
    ${"integer"} | ${"number"}
  `("generates a type declaration for $type", ({ type, output }) => {
    const coder = new SchemaTypeCoder(
      new Requirement({ type, xml: "should be ignored" })
    );
    const result = coder.write({});

    expect(result).toBe(output);
  });

  it("generates a type declaration for an object", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "object",

        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },

        xml: "should be ignored",
      })
    );

    const expected = format("const x = { name: string, age: number };");

    expect(format(`const x = ${coder.write()}`)).toStrictEqual(expected);
  });

  it("generates a type declaration for an object with additionalProperties", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "object",

        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },

        additionalProperties: { type: "string" },

        xml: "should be ignored",
      })
    );

    const expected = format(
      "type x = { name: string, age: number, [key: string]: unknown };"
    );

    expect(format(`type x = ${coder.write()}`)).toStrictEqual(expected);
  });

  it("generates a type declaration for an object with additionalProperties: true", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "object",

        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },

        additionalProperties: true,
      })
    );

    const expected = format(
      "type x = { name: string, age: number, [key: string]: unknown };"
    );

    expect(format(`type x = ${coder.write()}`)).toStrictEqual(expected);
  });

  it("generates a type declaration for an object with additionalProperties: false", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "object",

        properties: {
          name: { type: "string" },
          age: { type: "integer" },
        },

        additionalProperties: false,
      })
    );

    const expected = format("type x = { name: string, age: number };");

    expect(format(`type x = ${coder.write()}`)).toStrictEqual(expected);
  });

  it("generates a type declaration for an object with additionalProperties and no properties", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "object",

        properties: {
          name: { type: "string" },
          nickname: { type: "string" },
        },

        additionalProperties: { type: "string" },
      })
    );

    const expected = format(
      "type x = { name: string, nickname: string, [key: string]: string };"
    );

    expect(format(`type x = ${coder.write()}`)).toStrictEqual(expected);
  });

  it("generates a type declaration for an object with additionalProperties all of the same type", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "object",
        additionalProperties: { type: "string" },
      })
    );

    const expected = format("type x = { [key: string]: string };");

    expect(format(`type x = ${coder.write()}`)).toStrictEqual(expected);
  });

  it("generates a type declaration for an array", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "array",
        items: { type: "string" },
        xml: "should be ignored",
      })
    );

    const expected = format("type x = Array<string>;");

    expect(format(`type x = ${coder.write()}`)).toStrictEqual(expected);
  });

  it("has type JSONSchema6", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        type: "array",
        items: { type: "string" },
        xml: "should be ignored",
      })
    );

    expect(coder.typeDeclaration(undefined, {})).toBe("");
  });
});
