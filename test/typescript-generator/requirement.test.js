import { Requirement } from "../../src/typescript-generator/requirement.js";

describe("a Requirement", () => {
  it("select(name) - returns a new requirement", () => {
    const specification = {};
    const requirement = new Requirement(
      { phone: { type: "string" }, address: { type: "Address" } },
      "openapi.yaml#/components/schemas/Person",
      specification
    );

    const phone = requirement.select("phone");

    expect(phone.specification).toBe(specification);
    expect(phone.url).toBe("openapi.yaml#/components/schemas/Person/phone");
    expect(phone.data).toStrictEqual({ type: "string" });
  });

  it("knows if it is a reference ($ref)", () => {
    const yes = new Requirement({
      $ref: "some.yaml#other/url",
    });

    const no = new Requirement({
      type: "string",
    });

    expect([yes.isReference, no.isReference]).toStrictEqual([true, false]);
  });
});
