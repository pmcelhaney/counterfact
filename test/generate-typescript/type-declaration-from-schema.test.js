/* eslint-disable no-use-before-define */

function generateObjectType(schema) {
  const properties = Object.keys(schema.properties)
    .map((key) => {
      const property = schema.properties[key];

      return `${key}: ${generateType(property)}`;
    })
    .join(", ");

  return `{ ${properties} }`;
}

function generateType(schema) {
  if (schema.type === "string") {
    return "string";
  }

  if (schema.type === "integer") {
    return "number";
  }

  if (schema.type === "object") {
    return generateObjectType(schema);
  }

  if (schema.type === "array") {
    return `${generateType(schema.items)}[]`;
  }

  return `/* unknown type: ${schema.type} */`;
}

function generateTypeDeclaration(name, schema) {
  return `export type ${name} = ${generateType(schema)};`;
}

describe("typeScript generator", () => {
  it("creates a type declaration for a simple string", () => {
    const code = generateTypeDeclaration("foo", { type: "string" });

    expect(code).toBe("export type foo = string;");
  });

  it("creates a type declaration for an integer", () => {
    const code = generateTypeDeclaration("foo", { type: "integer" });

    expect(code).toBe("export type foo = number;");
  });

  it("creates a type declaration for an object", () => {
    const code = generateTypeDeclaration("foo", {
      type: "object",

      properties: {
        id: {
          type: "integer",
          format: "int64",
        },

        name: {
          type: "string",
        },
      },

      required: ["name"],

      example: {
        name: "Puma",
        id: 1,
      },
    });

    expect(code).toBe("export type foo = { id: number, name: string };");
  });

  it("creates a type declaration for an array", () => {
    const code = generateTypeDeclaration("foo", {
      type: "array",

      items: {
        type: "string",
      },
    });

    expect(code).toBe("export type foo = string[];");
  });

  it("creates a type declaration for an array of objects", () => {
    const code = generateTypeDeclaration("foo", {
      type: "array",

      items: {
        type: "object",

        properties: {
          id: {
            type: "integer",
            format: "int64",
          },

          name: {
            type: "string",
          },
        },
      },
    });

    expect(code).toBe("export type foo = { id: number, name: string }[];");
  });
});
