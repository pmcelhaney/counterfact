import { describe, expect, it } from "@jest/globals";

import { Requirement } from "../../src/typescript-generator/requirement.js";

describe("a Requirement", () => {
  it("select(name) - returns a new requirement", () => {
    const specification = {};
    const requirement = new Requirement(
      { address: { type: "Address" }, phone: { type: "string" } },
      "openapi.yaml#/components/schemas/Person",
      specification,
    );

    const phone = requirement.select("phone");

    expect(phone.specification).toBe(specification);
    expect(phone.url).toBe("openapi.yaml#/components/schemas/Person/phone");
    expect(phone.data).toStrictEqual({ type: "string" });
  });

  it("select(name) - escape special characters", () => {
    const requirement = new Requirement({
      "foo/bar": "slash",
      "foo~bar": "tilde",
    });

    expect(requirement.select("foo~0bar").data).toBe("tilde");
    expect(requirement.select("foo~1bar").data).toBe("slash");
  });

  it("get(name) - does not escape special characters", () => {
    const requirement = new Requirement({
      "foo/bar": "slash",
      "foo~bar": "tilde",
    });

    expect(requirement.get("foo~bar").data).toBe("tilde");
    expect(requirement.get("foo/bar").data).toBe("slash");
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
      address: { type: "Address" },
      "foo/bar~baz": { type: "SpecialChars" },
      phone: { type: "string" },
    });

    const phone = requirement.select("phone");
    const address = requirement.select("address");
    const specialChars = requirement.select("foo~1bar~0baz");

    const result = [];

    requirement.forEach((value, key) => {
      result.push([key, value]);
    });

    expect(result).toStrictEqual([
      ["address", address],
      ["foo/bar~baz", specialChars],
      ["phone", phone],
    ]);
  });

  it("provides a map() method", () => {
    const requirement = new Requirement({
      address: { type: "Address" },
      "foo/bar~baz": { type: "SpecialChars" },
      phone: { type: "string" },
    });

    const phone = requirement.select("phone");
    const address = requirement.select("address");
    const specialChars = requirement.select("foo~1bar~0baz");

    const result = requirement.map((subRequirement, key) => [
      `${key}!`,
      subRequirement,
    ]);

    expect(result).toStrictEqual([
      ["address!", address],
      ["foo/bar~baz!", specialChars],
      ["phone!", phone],
    ]);
  });

  it("provides a flatMap() method", () => {
    const requirement = new Requirement({
      a: "foo",

      b: "bar",
    });

    const result = requirement.flatMap((subRequirement, key) => [
      `${key}: ${subRequirement.data} 1`,

      `${key}: ${subRequirement.data} 2`,
    ]);

    expect(result).toStrictEqual([
      "a: foo 1",
      "a: foo 2",
      "b: bar 1",
      "b: bar 2",
    ]);
  });

  it("provides a find(fn) method", () => {
    const requirement = new Requirement({
      a: "foo",
      b: "bar",
    });

    const result = requirement.find(
      // eslint-disable-next-line jest/no-conditional-in-test
      (subRequirement, key) => key === "b" && subRequirement.data === "bar",
    );

    expect(result).toStrictEqual(requirement.get("b"));
  });
});
