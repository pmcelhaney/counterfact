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

    it("leaves prefix undefined when omitted so normalizeSpecs can derive it", () => {
      expect(normalizeSpecOption({ source: "api.yaml" })).toEqual([
        { source: "api.yaml", prefix: undefined, group: "" },
      ]);
    });

    it("defaults group to empty string when omitted", () => {
      expect(
        normalizeSpecOption({ source: "api.yaml", prefix: "/v2" }),
      ).toEqual([{ source: "api.yaml", prefix: "/v2", group: "" }]);
    });

    it("passes version through when present", () => {
      expect(
        normalizeSpecOption({
          source: "api.yaml",
          group: "my-api",
          version: "v1",
        }),
      ).toEqual([
        {
          source: "api.yaml",
          prefix: undefined,
          group: "my-api",
          version: "v1",
        },
      ]);
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

    it("leaves prefix undefined when omitted from an entry", () => {
      expect(
        normalizeSpecOption([{ source: "api.yaml", group: "v1" }]),
      ).toEqual([{ source: "api.yaml", prefix: undefined, group: "v1" }]);
    });

    it("defaults group to empty string when omitted from an entry", () => {
      expect(
        normalizeSpecOption([{ source: "api.yaml", prefix: "/v2" }]),
      ).toEqual([{ source: "api.yaml", prefix: "/v2", group: "" }]);
    });

    it("leaves both prefix undefined and group empty when both are omitted from an entry", () => {
      expect(normalizeSpecOption([{ source: "api.yaml" }])).toEqual([
        { source: "api.yaml", prefix: undefined, group: "" },
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
        { source: "b.yaml", prefix: undefined, group: "" },
      ]);
    });

    it("passes version through for each entry", () => {
      expect(
        normalizeSpecOption([
          { source: "v1.yaml", group: "my-api", version: "v1" },
          { source: "v2.yaml", group: "my-api", version: "v2" },
        ]),
      ).toEqual([
        {
          source: "v1.yaml",
          prefix: undefined,
          group: "my-api",
          version: "v1",
        },
        {
          source: "v2.yaml",
          prefix: undefined,
          group: "my-api",
          version: "v2",
        },
      ]);
    });
  });
});
