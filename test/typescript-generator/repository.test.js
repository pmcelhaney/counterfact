import { describe, expect, it } from "@jest/globals";
import { usingTemporaryFiles } from "using-temporary-files";

import { Repository } from "../../src/typescript-generator/repository.js";

describe("a Repository", () => {
  it("creates a new Script or returns an existing one", () => {
    const repository = new Repository("/base/path");

    const a = repository.get("a.ts");
    const b = repository.get("b.ts");
    const a2 = repository.get("a.ts");

    expect(a).not.toBe(b);
    expect(a2).toBe(a);
  });

  it.each([
    ["./path-types/x.ts", "../paths/_.context.ts"],
    ["./path-types/a/x.ts", "../../paths/_.context.ts"],
    ["./path-types/a/b/x.ts", "../../../paths/a/b/_.context.ts"],
    ["./path-types/a/b/c/x.ts", "../../../../paths/a/b/_.context.ts"],
  ])(
    "finds the relative location of the most relevant _.context.ts file (%s => %s)",
    async (importingFilePath, relativePathToNearestContext) => {
      await usingTemporaryFiles(async ({ add, path }) => {
        const repository = new Repository();

        await add("./paths/_.context.ts", "export class Context");
        await add("./paths/a/b/_.context.ts", "export class Context");

        expect(repository.findContextPath(path("."), importingFilePath)).toBe(
          relativePathToNearestContext,
        );
      });
    },
  );

  it("creates the root _.context.ts file", async () => {
    await usingTemporaryFiles(async ({ path, read }) => {
      const repository = new Repository();

      await repository.writeFiles(path("."));

      await expect(read("./paths/_.context.ts")).resolves.toContain(
        "export class Context",
      );
    });
  });

  it("does not overwrite an existing _.context.ts file", async () => {
    await usingTemporaryFiles(async ({ add, path, read }) => {
      const repository = new Repository();

      await add(
        "./paths/_.context.ts",
        "export class Context { /* do not overwrite me */ }",
      );

      await repository.writeFiles(path("."));

      await expect(read("./paths/_.context.ts")).resolves.toContain(
        "do not overwrite me",
      );
    });
  });
});
