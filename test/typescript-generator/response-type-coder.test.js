import { ResponseTypeCoder } from "../../src/typescript-generator/response-type-coder.js";

describe("a ResponseTypeCoder", () => {
  it("creates a type for a status code", () => {
    const coder = new ResponseTypeCoder();

    expect(coder.normalizeStatusCode("200", { default: {} })).toBe("200");
    expect(coder.normalizeStatusCode("default", { default: {} })).toBe(
      "[statusCode in HttpStatusCode]"
    );
    expect(coder.normalizeStatusCode("default", { 200: {}, 201: {} })).toBe(
      "[statusCode in Exclude<HttpStatusCode, 200 | 201>]"
    );
  });
});
