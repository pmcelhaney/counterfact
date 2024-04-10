import { describe, expect, it } from "@jest/globals";

import { Requirement } from "../../src/typescript-generator/requirement.js";
import { ResponseTypeCoder } from "../../src/typescript-generator/response-type-coder.js";

describe("a ResponseTypeCoder", () => {
  it("creates a type for a status code", () => {
    const coder = new ResponseTypeCoder({
      data: {
        200: {},
        default: {},
      },
    });

    expect(coder.normalizeStatusCode("200", { 200: {}, default: {} })).toBe(
      "200",
    );
  });

  it("creates a type for a default status code when some status codes are defined", () => {
    const coder = new ResponseTypeCoder({
      data: {
        200: {},
        201: {},
        default: {},
      },
    });

    expect(coder.normalizeStatusCode("default", { 200: {}, 201: {} })).toBe(
      "[statusCode in Exclude<HttpStatusCode, 200 | 201>]",
    );
  });

  it("creates a type for a default status code when its the only entry, so it could represent any status code", () => {
    const coder = new ResponseTypeCoder({
      data: {
        default: {},
      },
    });

    expect(coder.normalizeStatusCode("default", { default: {} })).toBe(
      "[statusCode in HttpStatusCode]",
    );
  });

  it("prints required headers", () => {
    const coder = new ResponseTypeCoder({
      data: {
        default: {},
      },
    });

    const headers = new Requirement({
      headers: {
        always: {
          required: true,
        },

        mandatory: {
          required: true,
        },

        occasionally: {},
        sometimes: {},
      },
    });

    expect(coder.printRequiredHeaders(headers)).toBe('"always" | "mandatory"');
  });
});
