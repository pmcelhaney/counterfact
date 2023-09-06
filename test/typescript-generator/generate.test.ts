import fs from "node:fs/promises";
import nodePath from "node:path";

import { generate } from "../../src/typescript-generator/generate.js";
import { Repository } from "../../src/typescript-generator/repository.js";
import { withTemporaryFiles } from "../lib/with-temporary-files.js";

describe("end-to-end test", () => {
  // Skip because it fails on Windows and I can't figure out why

  it("generates the same code for pet store that it did on the last test run", async () => {
    await withTemporaryFiles({}, async (basePath) => {
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate("./petstore.yaml", basePath, repository);
      await repository.finished();

      expect(repository.scripts).toMatchSnapshot();

      expect(
        await fs.readFile(nodePath.join(basePath, ".gitignore"), "utf8"),
      ).toMatchSnapshot();

      expect(
        await fs.readFile(
          nodePath.join(basePath, ".cache", "README.md"),
          "utf8",
        ),
      ).toMatchSnapshot();
    });
  });
});
