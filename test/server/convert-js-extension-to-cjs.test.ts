import { convertFileExtensionsToCjs } from "../../src/server/convert-js-extensions-to-cjs.js";

describe("convertFileExtensionsToCjs", () => {
  it("converts a local require", () => {
    expect(convertFileExtensionsToCjs('require("./foo.js");')).toEqual(
      'require("./foo.cjs");',
    );
  });

  it("does not convert a non-local require", () => {
    expect(convertFileExtensionsToCjs('require("foo/bar.js");')).toEqual(
      'require("foo/bar.js");',
    );
  });
});
