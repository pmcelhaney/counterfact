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
});
