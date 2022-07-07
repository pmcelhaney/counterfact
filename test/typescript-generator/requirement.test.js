import { Requirement } from "../../src/typescript-generator/requirement.js";

describe("a Requirement", () => {
  it("item(name) - returns a new requirement", () => {
    const specification = {};
    const requirement = new Requirement(
      specification,
      "openapi.yaml#/components/schemas/Person",
      { phone: { type: "string" }, address: { type: "Address" } }
    );

    const phone = requirement.item("phone");

    expect(phone.specification).toBe(specification);
    expect(phone.url).toBe("openapi.yaml#/components/schemas/Person/phone");
    expect(phone.data).toStrictEqual({ type: "string" });
  });
});
