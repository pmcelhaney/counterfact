import { describe, expect, it } from "@jest/globals";
import prettier from "prettier";

import { OperationTypeCoder } from "../../src/typescript-generator/operation-type-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

const dummyScript = {
  export(coder, isType) {
    // Safely return the first name from the coder's names generator, if available
    const getNames =
      coder && typeof coder.names === "function" ? coder.names() : undefined;
    if (!getNames || typeof getNames.next !== "function") {
      return undefined;
    }
    const result = getNames.next();
    if (!result || result.done) {
      return undefined;
    }
    return result.value;
  },

  import() {
    return "schema";
  },

  importDefault() {
    return "default";
  },

  importExternalType() {
    return "ExternalType";
  },

  importSharedType() {
    return "SharedType";
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
      "get",
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
      "get",
    );

    expect(coder.typeDeclaration(undefined, dummyScript)).toBe("");
  });

  it("returns the module path", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/hello~1world/get"),
      "get",
    );

    expect(coder.modulePath()).toBe("types/paths/hello/world.types.ts");
  });

  it("returns the module path for / ", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/~1/get"),
      "get",
    );

    expect(coder.modulePath()).toBe("types/paths/index.types.ts");
  });

  it("generates a complex post operation", async () => {
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

    const coder = new OperationTypeCoder(requirement, "get");

    await expect(
      format(`type TestType = ${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it("generates a complex post operation (OpenAPI 2)", async () => {
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

    const coder = new OperationTypeCoder(requirement, "get");

    await expect(
      format(`type TestType = ${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it("generates a complex post operation (OpenAPI 2, consumes in root)", async () => {
    const requirement = new Requirement(
      {
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

    requirement.specification = {
      rootRequirement: new Requirement({
        consumes: ["application/json"],
      }),
    };

    const coder = new OperationTypeCoder(requirement, "get");

    await expect(
      format(`type TestType = ${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it("generates a complex post operation (OpenAPI 2 with produces at the root)", async () => {
    const specification = new Specification(
      new Requirement({
        produces: ["application/json"],
      }),
    );

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
      specification,
    );

    const coder = new OperationTypeCoder(requirement, "get");

    await expect(
      format(`type TestType = ${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it("generates a simple get operation", async () => {
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

    const coder = new OperationTypeCoder(requirement, "get");

    await expect(
      format(`type TestType =${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it("generates a simple get operation (OpenAPI 2)", async () => {
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

    const coder = new OperationTypeCoder(requirement, "get");

    await expect(
      format(`type TestType =${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it("falls back to root level produces (OpenAPI 2)", async () => {
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

    const coder = new OperationTypeCoder(requirement, "get");

    await expect(
      format(`type TestType =${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it("generates an auth object for basic authentication", async () => {
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

    const coder = new OperationTypeCoder(requirement, "get", [
      {
        scheme: "basic",
        type: "http",
      },
    ]);

    await expect(
      format(`type TestType =${coder.write(dummyScript)}`),
    ).resolves.toMatchSnapshot();
  });

  it.skip("uses operationId for type names when available (PR #2)", () => {
    const coder = new OperationTypeCoder(
      new Requirement({ operationId: "addPet" }, "#/paths/pet/post"),
      "post",
    );

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual(["addPet", "addPet2", "addPet3"]);
  });

  it("uses HTTP_METHOD for operation type names", () => {
    const coder = new OperationTypeCoder(
      new Requirement({}, "#/paths/pet/post"),
      "post",
    );

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual([
      "HTTP_POST",
      "HTTP_POST2",
      "HTTP_POST3",
    ]);
  });

  it("exports parameter types separately and references them", async () => {
    const requirement = new Requirement(
      {
        operationId: "searchPets",
        parameters: [
          { in: "query", name: "name", schema: { type: "string" } },
          { in: "path", name: "id", schema: { type: "string" } },
          { in: "header", name: "x-api-key", schema: { type: "string" } },
        ],
        responses: {
          200: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Example" },
              },
            },
          },
        },
      },
      "#/paths/pet~1search~1{id}/get",
    );

    const scriptWithExportTracking = {
      ...dummyScript,
      exports: {},
      export(coder, isType) {
        const name = coder.names().next().value;
        this.exports[name] = coder;
        return name;
      },
    };

    const coder = new OperationTypeCoder(requirement, "get");

    // Verify that the main operation type name is HTTP_GET
    const [mainTypeName] = coder.names();
    expect(mainTypeName).toBe("HTTP_GET");

    const result = coder.write(scriptWithExportTracking);

    // Verify that parameter types are exported using operationId
    expect(scriptWithExportTracking.exports).toHaveProperty("searchPets_Query");
    expect(scriptWithExportTracking.exports).toHaveProperty("searchPets_Path");
    expect(scriptWithExportTracking.exports).toHaveProperty(
      "searchPets_Headers",
    );

    // Verify that the main type references the exported parameter types
    expect(result).toContain("query: searchPets_Query");
    expect(result).toContain("path: searchPets_Path");
    expect(result).toContain("headers: searchPets_Headers");
  });

  it("does not export parameter types when they are 'never'", async () => {
    const requirement = new Requirement(
      {
        operationId: "getPet",
        responses: {
          200: {
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Example" },
              },
            },
          },
        },
      },
      "#/paths/pet/get",
    );

    const scriptWithExportTracking = {
      ...dummyScript,
      exports: {},
      export(coder, isType) {
        const name = coder.names().next().value;
        this.exports[name] = coder;
        return name;
      },
    };

    const coder = new OperationTypeCoder(requirement, "get");

    // Verify that the main operation type name is HTTP_GET
    const [mainTypeName] = coder.names();
    expect(mainTypeName).toBe("HTTP_GET");

    const result = coder.write(scriptWithExportTracking);

    // Verify that parameter types are NOT exported when they are 'never'
    expect(scriptWithExportTracking.exports).not.toHaveProperty("getPet_Query");
    expect(scriptWithExportTracking.exports).not.toHaveProperty("getPet_Path");
    expect(scriptWithExportTracking.exports).not.toHaveProperty(
      "getPet_Headers",
    );

    // Verify that the main type uses 'never' directly
    expect(result).toContain("query: never");
    expect(result).toContain("path: never");
    expect(result).toContain("headers: never");
  });
});
