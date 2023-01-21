import prettier from "prettier";

import { OperationCoder } from "../../src/typescript-generator/operation-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

describe("an OperationCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new OperationCoder(new Requirement({}, "#/paths/hello/get"));

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual(["GET", "GET2", "GET3"]);
  });

  it("finds the request method in the URL", () => {
    const get = new OperationCoder(new Requirement({}, "#/paths/hello/get"));
    const put = new OperationCoder(new Requirement({}, "#/paths/hello/put"));

    expect(get.requestMethod()).toBe("GET");
    expect(put.requestMethod()).toBe("PUT");
  });

  it("creates a type declaration", () => {
    const coder = new OperationCoder(new Requirement({}, "#/paths/hello/get"));

    const script = {
      importType() {
        return "HTTP_GET";
      },
    };

    expect(coder.typeDeclaration(script)).toBe("HTTP_GET");
  });

  it("returns the module path", () => {
    const coder = new OperationCoder(
      new Requirement({}, "#/paths/hello~1world/get")
    );

    expect(coder.modulePath()).toBe("path/hello/world.types.ts");
  });

  it("generates a complex get operation", () => {
    const requirement = new Requirement(
      {
        parameters: [
          { name: "id", in: "path", schema: { type: "string" } },
          { name: "name", in: "query", schema: { type: "string" } },
        ],

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
      "#/paths/hello/get"
    );

    const coder = new OperationCoder(requirement);

    expect(
      format(
        coder.write({
          importType() {
            return "Type";
          },

          import() {
            return "schema";
          },
        })
      )
    ).toMatchSnapshot();
  });

  it("generates a simple post operation", () => {
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
      "#/paths/hello/post"
    );

    const coder = new OperationCoder(requirement);

    expect(
      format(
        coder.write({
          importType() {
            return "Type";
          },

          import() {
            return "schema";
          },
        })
      )
    ).toMatchSnapshot();
  });
});
