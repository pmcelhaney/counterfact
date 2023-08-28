/* eslint-disable jest/no-restricted-matchers */
import prettier from "prettier";

import { OperationTypeCoder } from "../../src/typescript-generator/operation-type-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

const dummyScript = {
  import() {
    return "schema";
  },

  importDefault() {
    return "default";
  },

  importExternalType() {
    return "ExternalType";
  },

  importType() {
    return "Type";
  },

  path: ".",
};

describe("an OperationTypeCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/hello/get"),
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
      new Requirement({}, "#/paths/hello/get"),
    );

    expect(coder.typeDeclaration(undefined, dummyScript)).toBe("");
  });

  it("returns the module path", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/hello~1world/get"),
    );

    expect(coder.modulePath()).toBe("path-types/hello/world.types.ts");
  });

  it("generates a complex post operation", () => {
    const requirement = new Requirement(
      {
        parameters: [
          { in: "path", name: "id", schema: { type: "string" } },
          { in: "query", name: "name", schema: { type: "string" } },
          { in: "header", name: "name", schema: { type: "string" } },
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
                examples: {
                  "first-example": {
                    value: "first",
                  },

                  "second-example": {
                    value: "second",
                  },
                },

                schema: { $ref: "#/components/schemas/Example" },
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
      "#/paths/hello/post",
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType = ${coder.write(dummyScript)}`),
    ).toMatchSnapshot();
  });

  it("generates a complex post operation (OpenAPI 2)", () => {
    const requirement = new Requirement(
      {
        consumes: ["application/json"],

        parameters: [
          { in: "path", name: "id", type: "string" },
          { in: "query", name: "name", type: "string" },
          { in: "header", name: "name", type: "string" },
          {
            in: "body",
            name: "body",
            schema: { $ref: "#/components/schemas/Example" },
          },
        ],

        produces: ["application/json"],

        responses: {
          200: {
            schema: { $ref: "#/components/schemas/Example" },
          },

          400: {
            schema: { $ref: "#/components/schemas/Error" },
          },

          default: {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      "#/paths/hello/post",
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType = ${coder.write(dummyScript)}`),
    ).toMatchSnapshot();
  });

  it("generates a complex post operation (OpenAPI 2 with produces at the root)", () => {
    const specification = new Specification();

    specification.rootRequirement = new Requirement({
      produces: ["application/json"],
    });

    const requirement = new Requirement(
      {
        consumes: ["application/json"],

        parameters: [
          { in: "path", name: "id", type: "string" },
          { in: "query", name: "name", type: "string" },
          { in: "header", name: "name", type: "string" },
          {
            in: "body",
            name: "body",
            schema: { $ref: "#/components/schemas/Example" },
          },
        ],

        responses: {
          200: {
            schema: { $ref: "#/components/schemas/Example" },
          },

          400: {
            schema: { $ref: "#/components/schemas/Error" },
          },

          default: {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      "#/paths/hello/post",
      specification,
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType = ${coder.write(dummyScript)}`),
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
      "#/paths/hello/get",
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType =${coder.write(dummyScript)}`),
    ).toMatchSnapshot();
  });

  it("generates a simple get operation (OpenAPI 2)", () => {
    const requirement = new Requirement(
      {
        produces: ["application/json"],

        responses: {
          default: {
            schema: { $ref: "#/components/schemas/Example" },
          },
        },
      },
      "#/paths/hello/get",
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType =${coder.write(dummyScript)}`),
    ).toMatchSnapshot();
  });

  it("falls back to root level produces (OpenAPI 2)", () => {
    const requirement = new Requirement(
      {
        produces: ["text/plain"],

        responses: {
          default: {
            schema: { $ref: "#/components/schemas/Example" },
          },
        },
      },
      "#/paths/hello/get",
    );

    const coder = new OperationTypeCoder(requirement);

    expect(
      format(`type TestType =${coder.write(dummyScript)}`),
    ).toMatchSnapshot();
  });
});
