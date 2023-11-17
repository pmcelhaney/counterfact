import { createResponseBuilder } from "../../src/server/response-builder.js";
import type { OpenApiOperation } from "../../src/server/types.d.ts";

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
      ?.match("application/json", { hello: "world" });

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
      ?.json({ hello: "world" })
      ?.html("<h1>Hello World</h1>");

    expect(response?.status).toBe(200);
    expect(response?.content).toStrictEqual([
      { body: "hello", type: "text/plain" },
      { body: { hello: "world" }, type: "application/json" },
      { body: "<h1>Hello World</h1>", type: "text/html" },
    ]);
  });

  it("adds headers", () => {
    const response = createResponseBuilder({
      responses: { 200: { content: {}, schema: {} } },
    })[200]
      ?.header("x-one", "one")
      ?.header("x-two", "2");

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
      expect(response?.content).toStrictEqual([
        { body: { value: "hello" }, type: "application/json" },
        { body: "example text response", type: "text/plain" },
      ]);
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

    it("using the status code", () => {
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
});
