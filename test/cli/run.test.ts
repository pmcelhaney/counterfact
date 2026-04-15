import { describe, expect, it } from "@jest/globals";

import { normalizeSpecOption } from "../../src/cli/run.js";

describe("normalizeSpecOption", () => {
  describe("when given undefined", () => {
    it("returns undefined", () => {
      expect(normalizeSpecOption(undefined)).toBeUndefined();
    });
  });

  describe("when given a string (CLI --spec flag)", () => {
    it("returns undefined so the caller can handle the positional shift", () => {
      expect(normalizeSpecOption("path/to/openapi.yaml")).toBeUndefined();
    });
  });

  describe("when given a single spec object", () => {
    it("wraps it in an array with all fields populated", () => {
      expect(
        normalizeSpecOption({
          source: "api.yaml",
          prefix: "/api",
          group: "v1",
        }),
      ).toEqual([{ source: "api.yaml", prefix: "/api", group: "v1" }]);
    });

    it("defaults prefix to empty string when omitted", () => {
      expect(normalizeSpecOption({ source: "api.yaml" })).toEqual([
        { source: "api.yaml", prefix: "", group: "" },
      ]);
    });

    it("defaults group to empty string when omitted", () => {
      expect(
        normalizeSpecOption({ source: "api.yaml", prefix: "/v2" }),
      ).toEqual([{ source: "api.yaml", prefix: "/v2", group: "" }]);
    });
  });

  describe("when given an array of spec objects", () => {
    it("maps each entry to a SpecConfig with all fields", () => {
      expect(
        normalizeSpecOption([
          { source: "pets.yaml", prefix: "/pets", group: "pets" },
          { source: "store.yaml", prefix: "/store", group: "store" },
        ]),
      ).toEqual([
        { source: "pets.yaml", prefix: "/pets", group: "pets" },
        { source: "store.yaml", prefix: "/store", group: "store" },
      ]);
    });

    it("defaults prefix to empty string when omitted from an entry", () => {
      expect(
        normalizeSpecOption([{ source: "api.yaml", group: "v1" }]),
      ).toEqual([{ source: "api.yaml", prefix: "", group: "v1" }]);
    });

    it("defaults group to empty string when omitted from an entry", () => {
      expect(
        normalizeSpecOption([{ source: "api.yaml", prefix: "/v2" }]),
      ).toEqual([{ source: "api.yaml", prefix: "/v2", group: "" }]);
    });

    it("defaults both prefix and group when both are omitted from an entry", () => {
      expect(normalizeSpecOption([{ source: "api.yaml" }])).toEqual([
        { source: "api.yaml", prefix: "", group: "" },
      ]);
    });

    it("handles an empty array", () => {
      expect(normalizeSpecOption([])).toEqual([]);
    });

    it("handles a mixed array where some entries have optional fields and some do not", () => {
      expect(
        normalizeSpecOption([
          { source: "a.yaml", prefix: "/a", group: "a" },
          { source: "b.yaml" },
        ]),
      ).toEqual([
        { source: "a.yaml", prefix: "/a", group: "a" },
        { source: "b.yaml", prefix: "", group: "" },
      ]);
    });
  });
});
