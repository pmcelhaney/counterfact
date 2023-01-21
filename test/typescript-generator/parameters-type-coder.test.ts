import prettier from "prettier";

import { ParametersTypeCoder } from "../../src/typescript-generator/parameters-type-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

describe("a ParametersTypeCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new ParametersTypeCoder(new Requirement({}));

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual([
      "parameters",
      "parameters2",
      "parameters3",
    ]);
  });

  it("generates types for parameters", () => {
    const requirement = new Requirement([
      { name: "id", in: "path", schema: { type: "string" }, required: true },
      { name: "name", in: "query", schema: { type: "string" } },
      { name: "age", in: "query", schema: { type: "number" } },
      { name: "name", in: "header", schema: { type: "string" } },
    ]);

    const pathCoder = new ParametersTypeCoder(requirement, "path");
    const queryCoder = new ParametersTypeCoder(requirement, "query");
    const headerCoder = new ParametersTypeCoder(requirement, "header");

    expect(format(`type TestType =${pathCoder.write({})}`)).toMatchSnapshot(
      "path"
    );
    expect(format(`type TestType =${queryCoder.write({})}`)).toMatchSnapshot(
      "query"
    );
    expect(format(`type TestType =${headerCoder.write({})}`)).toMatchSnapshot(
      "header"
    );
  });

  it("generates types for parameters (OAS2)", () => {
    const requirement = new Requirement([
      { name: "id", in: "path", type: "string", required: true },
      { name: "name", in: "query", type: "string" },
      { name: "age", in: "query", type: "number" },
      { name: "name", in: "header", type: "string" },
    ]);

    const pathCoder = new ParametersTypeCoder(requirement, "path");
    const queryCoder = new ParametersTypeCoder(requirement, "query");
    const headerCoder = new ParametersTypeCoder(requirement, "header");

    expect(format(`type TestType =${pathCoder.write({})}`)).toMatchSnapshot(
      "path"
    );
    expect(format(`type TestType =${queryCoder.write({})}`)).toMatchSnapshot(
      "query"
    );
    expect(format(`type TestType =${headerCoder.write({})}`)).toMatchSnapshot(
      "header"
    );
  });

  it("generates type never when there is no match", () => {
    const requirement = new Requirement([
      { name: "id", in: "path", schema: { type: "string" }, required: true },
    ]);

    const coder = new ParametersTypeCoder(requirement, "query");

    expect(format(`type TestType =${coder.write({})}`)).toMatchSnapshot();
  });

  it("has no type", () => {
    const coder = new ParametersTypeCoder(new Requirement({}));

    expect(coder.typeDeclaration({})).toBe("");
  });

  it("calculates the modulePath", () => {
    const coder = new ParametersTypeCoder(
      new Requirement({}, "/components/parameters/foo")
    );

    expect(coder.modulePath()).toBe("parameters/parameters.types.ts");
  });
});
