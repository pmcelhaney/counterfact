import { describe, expect, it } from "@jest/globals";
import prettier from "prettier";

import { OperationCoder } from "../../src/typescript-generator/operation-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

describe("an OperationCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new OperationCoder(
      new Requirement({}, "#/paths/hello/get"),
      "get",
    );

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual(["GET", "GET2", "GET3"]);
  });

  it("creates a type declaration", () => {
    const coder = new OperationCoder(
      new Requirement({}, "#/paths/hello/get"),
      "get",
    );

    const script = {
      importType() {
        return "HTTP_GET";
      },
    };

    expect(coder.typeDeclaration(undefined, script)).toBe("HTTP_GET");
  });

  it("returns the module path", () => {
    const coder = new OperationCoder(
      new Requirement({}, "#/paths/hello~1world/get", "get"),
      "get",
    );

    expect(coder.modulePath()).toBe("routes/hello/world.types.ts");
  });

  it("generates a complex get operation", async () => {
    const requirement = new Requirement(
      {
        parameters: [
          { in: "path", name: "id", schema: { type: "string" } },
          { in: "query", name: "name", schema: { type: "string" } },
        ],

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
      "#/paths/hello/get",
    );

    const coder = new OperationCoder(requirement, "get");

    await expect(
      format(
        coder.write({
          import() {
            return "schema";
          },

          importType() {
            return "Type";
          },
        }),
      ),
    ).resolves.toMatchSnapshot();
  });

  it("generates a simple post operation", async () => {
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
      "#/paths/hello/post",
    );

    const coder = new OperationCoder(requirement, "get");

    await expect(
      format(
        coder.write({
          import() {
            return "schema";
          },

          importType() {
            return "Type";
          },
        }),
      ),
    ).resolves.toMatchSnapshot();
  });
});
