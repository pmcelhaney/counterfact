import { usingTemporaryFiles } from "using-temporary-files";

import { getModuleKind } from "../../src/typescript-generator/get-module-kind.js";

describe("getModuleKind", () => {
  it("returns the module type from package.json in the current directory", async () => {
    await usingTemporaryFiles(async ({ add, path }) => {
      await add("package.json", JSON.stringify({ type: "module" }));

      await expect(getModuleKind(path("."))).resolves.toBe("module");
    });
  });

  it("returns the module type from package.json in a parent directory", async () => {
    await usingTemporaryFiles(async ({ add, path }) => {
      await add(
        "subdirectory/package.json",
        JSON.stringify({ type: "module" }),
      );

      await expect(getModuleKind(path("./subdirectory"))).resolves.toBe(
        "module",
      );
    });
  });

  it('returns "commonjs" if type is not specified in package.json', async () => {
    await usingTemporaryFiles(async ({ add, path }) => {
      await add("package.json", JSON.stringify({}));

      await expect(getModuleKind(path("."))).resolves.toBe("commonjs");
    });
  });

  it("returns commonjs if no package.json is found", async () => {
    await usingTemporaryFiles(async ({ path }) => {
      await expect(getModuleKind(path("."))).resolves.toBe("commonjs");
    });
  });
});
