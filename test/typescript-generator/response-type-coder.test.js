import { describe, expect, it } from "@jest/globals";

import { Requirement } from "../../src/typescript-generator/requirement.js";
import { ResponseTypeCoder } from "../../src/typescript-generator/response-type-coder.js";

describe("a ResponsesTypeCoder", () => {
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
