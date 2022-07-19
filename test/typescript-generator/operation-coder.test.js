import prettier from "prettier";

import { OperationCoder } from "../../src/typescript-generator/operation-coder";
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
});
