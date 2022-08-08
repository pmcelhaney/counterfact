import { createResponseBuilder } from "../src/response-builder.js";

describe("a response builder", () => {
  it("starts building a response object when the status is selected", () => {
    const response = createResponseBuilder();

    expect(response[200].status).toBe(200);
    expect(response["404 NOT FOUND"].status).toBe(404);
  });

  it("adds a content type and body with match()", () => {
    const response = createResponseBuilder()[200]
      .match("text/plain", "hello")
      .match("application/json", { hello: "world" });

    expect(response.status).toBe(200);
    expect(response.content).toStrictEqual([
      { type: "text/plain", body: "hello" },
      { type: "application/json", body: { hello: "world" } },
    ]);
  });

  it("has shortcuts for json, text, and html", () => {
    const response = createResponseBuilder()[200]
      .text("hello")
      .json({ hello: "world" })
      .html("<h1>Hello World</h1>");

    expect(response.status).toBe(200);
    expect(response.content).toStrictEqual([
      { type: "text/plain", body: "hello" },
      { type: "application/json", body: { hello: "world" } },
      { type: "text/html", body: "<h1>Hello World</h1>" },
    ]);
  });

  it("adds headers", () => {
    const response = createResponseBuilder()[200]
      .header("x-one", "one")
      .header("x-two", 2);

    expect(response.status).toBe(200);
    expect(response.headers).toStrictEqual({
      "x-one": "one",
      "x-two": 2,
    });
  });

  describe("builds a random response based on an Open API operation object", () => {
    const operation = {
      responses: {
        200: {
          content: {
            "application/json": {
              schema: {
                type: "object",

                properties: {
                  value: {
                    type: "string",
                    required: true,
                    examples: ["hello"],
                  },
                },

                additionalProperties: false,
              },
            },

            "text/plain": {
              schema: {
                type: "string",
                examples: ["hello"],
              },
            },
          },
        },

        default: {
          content: {
            "text/plain": {
              schema: {
                type: "string",
                examples: ["an error occurred"],
              },
            },
          },
        },
      },
    };

    it("using the status code", () => {
      const response = createResponseBuilder(operation)[200].random();

      expect(response.status).toBe(200);
      expect(response.content).toStrictEqual([
        { type: "application/json", body: { value: "hello" } },
        { type: "text/plain", body: "hello" },
      ]);
    });

    it("falls back to 'default' when status code is not listed explicitly", () => {
      const response = createResponseBuilder(operation)[403].random();

      expect(response.status).toBe(403);
      expect(response.content).toStrictEqual([
        { type: "text/plain", body: "an error occurred" },
      ]);
    });

    it("returns 500 if it doesn't know what to do with the status code", () => {
      const operationWithoutDefault = { ...operation };

      delete operationWithoutDefault.responses.default;

      const response = createResponseBuilder(
        operationWithoutDefault
      )[403].random();

      expect(response.status).toBe(500);
      expect(response.content).toStrictEqual([
        {
          type: "text/plain",
          body: "The Open API document does not specify a response for status code 403",
        },
      ]);
    });
  });
});
