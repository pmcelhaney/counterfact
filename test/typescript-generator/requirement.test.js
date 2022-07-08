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

  it("provides a forEach() method", () => {
    const requirement = new Requirement({
      phone: { type: "string" },
      address: { type: "Address" },
    });

    const phone = requirement.select("phone");
    const address = requirement.select("address");

    const result = [];

    requirement.forEach((entry) => {
      result.push(entry);
    });

    expect(result).toStrictEqual([
      ["phone", phone],
      ["address", address],
    ]);
  });
});
