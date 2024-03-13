/* eslint-disable max-statements */
import prettier from "prettier";

import { Requirement } from "../../src/typescript-generator/requirement.js";
import { SchemaTypeCoder } from "../../src/typescript-generator/schema-type-coder.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

describe("a SchemaTypeCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({ $ref: "/components/schemas/Example" }),
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
      new Requirement({ $ref: "/components/schemas/Example" }),
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
  `("generates a type declaration for $type", ({ output, type }) => {
    const coder = new SchemaTypeCoder(
      new Requirement({ type, xml: "should be ignored" }),
    );
    const result = coder.write({});

    expect(result).toBe(output);
  });

  it("generates a type declaration for an object", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        properties: {
          age: { type: "integer" },
          name: { type: "string" },
        },

        type: "object",

        xml: "should be ignored",
      }),
    );

    const expected = await format("type x = { age?: number, name?: string };");

    await expect(format(`type x = ${coder.write()}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for an object with additionalProperties", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        additionalProperties: { type: "string" },

        properties: {
          age: { type: "integer" },
          name: { type: "string" },
        },

        type: "object",

        xml: "should be ignored",
      }),
    );

    const expected = await format(
      "type x = { age?: number, name?: string, [key: string]: unknown };",
    );

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for an object with required properties", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        properties: {
          anotherRequiredString: { type: "string" },
          optionalString: { type: "string" },
          requiredString: { required: true, type: "string" },
          "with spaces": { type: "string" },
        },

        required: ["anotherRequiredString"],

        type: "object",
      }),
    );

    const expected = await format(
      `type x = { 
        anotherRequiredString: string, 
        optionalString?: string, 
        requiredString: string, 
        "with spaces"?: string  };
      `,
    );

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for an object with additionalProperties: true", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        additionalProperties: true,

        properties: {
          age: { type: "integer" },
          name: { type: "string" },
        },

        type: "object",
      }),
    );

    const expected = await format(
      "type x = {  age?: number, name?: string, [key: string]: unknown };",
    );

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for an object with additionalProperties: false", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        additionalProperties: false,

        properties: {
          age: { type: "integer" },
          name: { type: "string" },
        },

        type: "object",
      }),
    );

    const expected = await format("type x = {  age?: number, name?: string};");

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for an object with additionalProperties and no properties", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        additionalProperties: { type: "boolean" },

        type: "object",
      }),
    );

    const expected = await format("type x = {  [key: string]: boolean };");

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for an object with additionalProperties all of the same type", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        additionalProperties: { type: "number" },

        properties: {
          anotherNumber: { type: "number" },
          aNumber: { type: "number" },
        },

        type: "object",
      }),
    );

    const expected = await format(
      "type x = { anotherNumber?: number; aNumber?: number; [key: string]: number };",
    );

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for an array", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        items: { type: "string" },
        type: "array",
        xml: "should be ignored",
      }),
    );

    const expected = await format("type x = Array<string>;");

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for allOf", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        allOf: [{ type: "string" }, { type: "number" }],
      }),
    );

    const expected = await format("type x = string & number;");

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for anyOf", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        anyOf: [{ type: "string" }, { type: "number" }],
      }),
    );

    const expected = await format("type x = string | number;");

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for oneOf", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        oneOf: [{ type: "string" }, { type: "number" }],
      }),
    );

    const expected = await format("type x = string | number;");

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for not (unknown)", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        not: { type: "string" },
      }),
    );

    // not is not expressible in TypeScript
    // The best we could do is Exclude<any, string>, but that doesn't actually exclude strings
    const expected = await format("type x = unknown;");

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("generates a type declaration for enum", async () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        // eslint-disable-next-line unicorn/no-null
        enum: [1, "two", null],
      }),
    );

    const expected = await format('type x = 1 | "two" | null;');

    await expect(format(`type x = ${coder.write({})}`)).resolves.toStrictEqual(
      expected,
    );
  });

  it("has type JSONSchema6", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        items: { type: "string" },
        type: "array",
        xml: "should be ignored",
      }),
    );

    expect(coder.typeDeclaration(undefined, {})).toBe("");
  });

  it("calculates the modulePath", () => {
    const coder = new SchemaTypeCoder(
      new Requirement({
        $ref: "components/Example",
      }),
    );

    expect(coder.modulePath()).toBe("components/Example.ts");
  });
});
