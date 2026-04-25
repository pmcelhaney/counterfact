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
      ).toEqual([
        { source: "api.yaml", prefix: "/api", group: "v1", version: "" },
      ]);
    });

    it("defaults prefix to empty string when omitted", () => {
      expect(normalizeSpecOption({ source: "api.yaml" })).toEqual([
        { source: "api.yaml", prefix: "", group: "", version: "" },
      ]);
    });

    it("defaults group to empty string when omitted", () => {
      expect(
        normalizeSpecOption({ source: "api.yaml", prefix: "/v2" }),
      ).toEqual([
        { source: "api.yaml", prefix: "/v2", group: "", version: "" },
      ]);
    });

    it("passes through version when provided", () => {
      expect(
        normalizeSpecOption({
          source: "api.yaml",
          group: "my-api",
          version: "v1",
        }),
      ).toEqual([
        { source: "api.yaml", prefix: "", group: "my-api", version: "v1" },
      ]);
    });

    it("defaults version to empty string when omitted", () => {
      expect(
        normalizeSpecOption({ source: "api.yaml", prefix: "/v2", group: "g" }),
      ).toEqual([
        { source: "api.yaml", prefix: "/v2", group: "g", version: "" },
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
        { source: "pets.yaml", prefix: "/pets", group: "pets", version: "" },
        { source: "store.yaml", prefix: "/store", group: "store", version: "" },
      ]);
    });

    it("defaults prefix to empty string when omitted from an entry", () => {
      expect(
        normalizeSpecOption([{ source: "api.yaml", group: "v1" }]),
      ).toEqual([{ source: "api.yaml", prefix: "", group: "v1", version: "" }]);
    });

    it("defaults group to empty string when omitted from an entry", () => {
      expect(
        normalizeSpecOption([{ source: "api.yaml", prefix: "/v2" }]),
      ).toEqual([
        { source: "api.yaml", prefix: "/v2", group: "", version: "" },
      ]);
    });

    it("defaults both prefix and group when both are omitted from an entry", () => {
      expect(normalizeSpecOption([{ source: "api.yaml" }])).toEqual([
        { source: "api.yaml", prefix: "", group: "", version: "" },
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
        { source: "a.yaml", prefix: "/a", group: "a", version: "" },
        { source: "b.yaml", prefix: "", group: "", version: "" },
      ]);
    });

    it("passes through version for each entry when provided", () => {
      expect(
        normalizeSpecOption([
          { source: "v1.yaml", group: "my-api", version: "v1" },
          { source: "v2.yaml", group: "my-api", version: "v2" },
        ]),
      ).toEqual([
        { source: "v1.yaml", prefix: "", group: "my-api", version: "v1" },
        { source: "v2.yaml", prefix: "", group: "my-api", version: "v2" },
      ]);
    });

    it("defaults version to empty string when omitted from an entry in an array", () => {
      expect(
        normalizeSpecOption([
          { source: "a.yaml", group: "a", version: "v1" },
          { source: "b.yaml", group: "b" },
        ]),
      ).toEqual([
        { source: "a.yaml", prefix: "", group: "a", version: "v1" },
        { source: "b.yaml", prefix: "", group: "b", version: "" },
      ]);
    });
  });
});
