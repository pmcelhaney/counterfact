/* eslint-disable jest/no-restricted-matchers */
import prettier from "prettier";

import { OperationTypeCoder } from "../../src/typescript-generator/operation-type-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

const dummyScript = {
  path: ".",

  importExternalType() {
    return "ExternalType";
  },

  importType() {
    return "Type";
  },

  import() {
    return "schema";
  },
};

describe("an OperationTypeCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/hello/get")
    );

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual([
      "HTTP_GET",
      "HTTP_GET2",
      "HTTP_GET3",
    ]);
  });

  it("creates a type declaration", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/hello/get")
    );

    expect(coder.typeDeclaration(undefined, dummyScript)).toBe("");
  });

  it("returns the module path", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/hello~1world/get")
    );

    expect(coder.modulePath()).toBe("path-types/hello/world.types.ts");
  });

  it("generates a complex post operation", () => {
    const requirement = new Requirement(
      {
        parameters: [
          { name: "id", in: "path", schema: { type: "string" } },
          { name: "name", in: "query", schema: { type: "string" } },
          { name: "name", in: "header", schema: { type: "string" } },
        ],

        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Example" },
            },
          },
        },

        responses: {
          200: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Example" },

                examples: {
                  "first-example": {
                    value: "first",
                  },

                  "second-example": {
                    value: "second",
                  },
                },
              },
            },
          },

          400: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },

          default: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      "#/paths/hello/post"
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType = ${coder.write(dummyScript)}`)
    ).toMatchSnapshot();
  });

  it("generates a simple get operation", () => {
    const requirement = new Requirement(
      {
        responses: {
          default: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Example" },
              },
            },
          },
        },
      },
      "#/paths/hello/get"
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType =${coder.write(dummyScript)}`)
    ).toMatchSnapshot();
  });
});
