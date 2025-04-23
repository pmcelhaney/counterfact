import { Config } from "../../src/server/config.ts";
import { createResponseBuilder } from "../../src/server/response-builder.js";
import type { OpenApiOperation } from "../../src/server/types.ts";
import retry from "jest-retries";

describe("a response builder", () => {
  it("starts building a response object when the status is selected", () => {
    const response = createResponseBuilder({
      responses: { 200: { content: {} } },
    });

    expect(response[200]?.status).toBe(200);
    expect(response["404 NOT FOUND"]?.status).toBe(404);
  });

  it("adds a content type and body with match()", () => {
    const response = createResponseBuilder({
      responses: { 200: { content: {}, schema: {} } },
    })[200]
      ?.match("text/plain", "hello")
      .match("application/json", { hello: "world" });

    expect(response?.status).toBe(200);
    expect(response?.content).toStrictEqual([
      { body: "hello", type: "text/plain" },
      { body: { hello: "world" }, type: "application/json" },
    ]);
  });

  it("has shortcuts for json, text, and html", () => {
    const response = createResponseBuilder({
      responses: { 200: { content: {}, schema: {} } },
    })[200]
      ?.text("hello")
      .json({ hello: "world" })
      .html("<h1>Hello World</h1>")
      .xml({ hello: "world" });

    expect(response?.status).toBe(200);
    expect(response?.content).toStrictEqual([
      { body: "hello", type: "text/plain" },
      { body: { hello: "world" }, type: "application/json" },
      { body: { hello: "world" }, type: "text/json" },
      { body: { hello: "world" }, type: "text/x-json" },
      { body: "<h1>Hello World</h1>", type: "text/html" },
      {
        body: "<root><hello>world</hello></root>",
        type: "application/xml",
      },
      {
        body: "<root><hello>world</hello></root>",
        type: "text/xml",
      },
    ]);
  });

  it("adds headers", () => {
    const response = createResponseBuilder({
      responses: { 200: { content: {}, schema: {} } },
    })[200]
      ?.header("x-one", "one")
      .header("x-two", "2");

    expect(response?.status).toBe(200);
    expect(response?.headers).toStrictEqual({
      "x-one": "one",
      "x-two": "2",
    });
  });

  describe("builds a random response based on an Open API operation object", () => {
    const operation: OpenApiOperation = {
      responses: {
        200: {
          content: {
            "application/json": {
              schema: {
                additionalProperties: false,

                properties: {
                  value: {
                    examples: ["hello"],
                    required: true,
                    type: "string",
                  },
                },

                type: "object",
              },
            },

            "text/plain": {
              examples: {
                text: {
                  description: "a text response",
                  summary: "summary",
                  value: "example text response",
                },
              },

              schema: {
                examples: ["hello"],
                type: "string",
              },
            },
          },
        },

        default: {
          content: {
            "text/plain": {
              schema: {
                examples: ["an error occurred"],
                type: "string",
              },
            },
          },
        },
      },
    };

    it("using the status code", () => {
      const response = createResponseBuilder(operation)[200]?.random();

      expect(response?.status).toBe(200);

      expect(response?.content?.[1]).toStrictEqual({
        body: "example text response",
        type: "text/plain",
      });

      // Something in json-schema-faker changed so this is no longer deterministic
      //
      // expect(response?.content?.[0]).toStrictEqual({
      //   body: { value: "hello" },
      //   type: "application/json",
      // });
    });

    it("correctly handles alwaysFakeOptionals option", () => {
      const operationWithoutExamples: OpenApiOperation = {
        responses: {
          200: {
            content: {
              "application/json": {
                schema: {
                  additionalProperties: false,

                  properties: {
                    value: {
                      required: true,
                      type: "string",
                    },
                    label: {
                      nullable: true,
                      type: "string",
                    },
                  },

                  type: "object",
                },
              },
            },
          },

          default: {
            content: {
              "text/plain": {
                schema: {
                  examples: ["an error occurred"],
                  type: "string",
                },
              },
            },
          },
        },
      };
      const response = createResponseBuilder(operationWithoutExamples, {
        alwaysFakeOptionals: true,
      } as Config)[200]?.random();

      expect(response?.status).toBe(200);
      // @ts-expect-error
      expect(response!.content[0].body.label).toBeDefined();
    });

    it("falls back to 'default' when status code is not listed explicitly", () => {
      const response = createResponseBuilder(operation)[403]?.random();

      expect(response?.status).toBe(403);
      expect(response?.content).toStrictEqual([
        { body: "an error occurred", type: "text/plain" },
      ]);
    });

    it("returns 500 if it doesn't know what to do with the status code", () => {
      const operationWithoutDefault = { ...operation };

      delete operationWithoutDefault.responses.default;

      const response = createResponseBuilder(
        operationWithoutDefault,
      )[403]?.random();

      expect(response?.status).toBe(500);
      expect(response?.content).toStrictEqual([
        {
          body: "The Open API document does not specify a response for status code 403",
          type: "text/plain",
        },
      ]);
    });

    it("returns 500 if it doesn't know what to do with the status code", () => {
      const operationWithInvalidSchema = structuredClone(operation);

      // @ts-expect-error TypeScript can't track the type with structuredClone()
      operationWithInvalidSchema.responses[200].content[
        "application/json"
      ].schema.type = "file";

      const response = createResponseBuilder(
        operationWithInvalidSchema,
      )[200]?.random();

      expect(response?.status).toBe(200);
      expect(response?.content).toStrictEqual([
        {
          body: undefined,
          type: "application/json",
        },
        {
          body: "example text response",
          type: "text/plain",
        },
      ]);
    });
  });

  describe("builds a random response based on an Open API operation object (OpenAPI 2)", () => {
    const operation: OpenApiOperation = {
      produces: ["application/json", "text/plain"],

      responses: {
        200: {
          examples: { text: "example response" },

          schema: {
            additionalProperties: false,

            properties: {
              value: {
                examples: ["hello"],
                required: true,
                type: "string",
              },
            },

            type: "object",
          },
        },

        default: {
          schema: {
            examples: ["an error occurred"],
            type: "string",
          },
        },
      },
    };

    retry("using the status code", 10, () => {
      const response = createResponseBuilder(operation)[200]?.random();

      expect(response?.status).toBe(200);
      expect(response?.content).toStrictEqual([
        { body: "example response", type: "application/json" },
        { body: "example response", type: "text/plain" },
      ]);
    });

    it("falls back to 'default' when status code is not listed explicitly", () => {
      const response = createResponseBuilder(operation)[403]?.random();

      expect(response?.status).toBe(403);
      expect(response?.content).toStrictEqual([
        { body: "an error occurred", type: "application/json" },
        { body: "an error occurred", type: "text/plain" },
      ]);
    });

    it("returns 500 if it doesn't know what to do with the status code", () => {
      const operationWithoutDefault = { ...operation };

      delete operationWithoutDefault.responses.default;

      const response = createResponseBuilder(
        operationWithoutDefault,
      )[403]?.random();

      expect(response?.status).toBe(500);
      expect(response?.content).toStrictEqual([
        {
          body: "The Open API document does not specify a response for status code 403",
          type: "text/plain",
        },
      ]);
    });
  });

  it("handles binary data responses", () => {
    const operation: OpenApiOperation = {
      responses: {
        200: {
          content: {
            "application/octet-stream": {
              schema: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
      },
    };

    const response = createResponseBuilder(operation)[200]?.binary(
      Buffer.from("binary data", "utf-8"),
    );

    expect(response?.status).toBe(200);
    expect(response?.content).toStrictEqual([
      {
        body: Buffer.from("binary data", "utf-8"),
        type: "application/octet-stream",
      },
    ]);
  });
});
