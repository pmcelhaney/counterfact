import { describe, expect, it } from "@jest/globals";

import { usingTemporaryFiles } from "using-temporary-files";

import { readFile } from "../../src/util/read-file.js";

describe("readFile", () => {
  it("reads a local file by path", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("test.txt", "hello from file");
      const content = await readFile($.path("test.txt"));
      expect(content).toBe("hello from file");
    });
  });

  it("reads a local file using a file:// URL", async () => {
    await usingTemporaryFiles(async ($) => {
      await $.add("test.txt", "hello from file url");
      const fileUrl = new URL($.path("test.txt"), "file://").href;
      const content = await readFile(fileUrl);
      expect(content).toBe("hello from file url");
    });
  });
});
