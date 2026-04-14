import { describe, expect, it } from "@jest/globals";

import {
  toForwardSlashPath,
  type ForwardSlashPath,
} from "../../src/util/forward-slash-path.js";

describe("toForwardSlashPath", () => {
  it("returns the same string when there are no backslashes", () => {
    expect(toForwardSlashPath("/foo/bar/baz")).toBe("/foo/bar/baz");
  });

  it("replaces backslashes with forward slashes", () => {
    expect(toForwardSlashPath("C:\\Users\\foo\\bar")).toBe("C:/Users/foo/bar");
  });

  it("replaces all backslashes in the string", () => {
    expect(toForwardSlashPath("a\\b\\c\\d")).toBe("a/b/c/d");
  });

  it("returns an empty string unchanged", () => {
    expect(toForwardSlashPath("")).toBe("");
  });

  it("returns a ForwardSlashPath branded type", () => {
    const result = toForwardSlashPath("a\\b");
    // The branded type is assignable to string
    const _check: ForwardSlashPath = result;
    expect(typeof result).toBe("string");
  });
});
