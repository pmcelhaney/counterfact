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
    ["./types/paths/x.ts", "../../routes/_.context.ts"],
    ["./types/paths/a/x.ts", "../../../routes/_.context.ts"],
    ["./types/paths/a/b/x.ts", "../../../../routes/a/b/_.context.ts"],
    ["./types/paths/a/b/c/x.ts", "../../../../../routes/a/b/_.context.ts"],
  ])(
    "finds the relative location of the most relevant _.context.ts file (%s => %s)",
    async (importingFilePath, relativePathToNearestContext) => {
      await usingTemporaryFiles(async ({ add, path }) => {
        const repository = new Repository();

        await add("./routes/_.context.ts", "export class Context");
        await add("./routes/a/b/_.context.ts", "export class Context");

        expect(repository.findContextPath(path("."), importingFilePath)).toBe(
          relativePathToNearestContext,
        );
      });
    },
  );

  it("creates the root _.context.ts file", async () => {
    await usingTemporaryFiles(async ({ path, read }) => {
      const repository = new Repository();

      await repository.writeFiles(path("."), { routes: true, types: true });

      await expect(read("./routes/_.context.ts")).resolves.toContain(
        "export class Context",
      );
    });
  });

  it("includes a strongly typed $ constructor argument in the default _.context.ts", async () => {
    await usingTemporaryFiles(async ({ path, read }) => {
      const repository = new Repository();

      await repository.writeFiles(path("."), { routes: true, types: true });

      const contents = await read("./routes/_.context.ts");

      expect(contents).toContain("ContextConstructorArgument");
      expect(contents).toContain("constructor($: ContextConstructorArgument)");
      expect(contents).toContain(
        'import type { ContextConstructorArgument } from "../counterfact-types/index.js"',
      );
    });
  });

  it("does not create the root _.context.ts file when generate routes is false", async () => {
    await usingTemporaryFiles(async ({ path, read }) => {
      const repository = new Repository();

      await repository.writeFiles(path("."), { routes: false, types: true });

      await expect(read("./paths/_.context.ts")).rejects.toThrow(
        "no such file or directory",
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

      await repository.writeFiles(path("."), { routes: true, types: true });

      await expect(read("./paths/_.context.ts")).resolves.toContain(
        "do not overwrite me",
      );
    });
  });
});
