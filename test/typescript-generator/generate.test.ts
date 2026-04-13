import { usingTemporaryFiles } from "using-temporary-files";

import { generate } from "../../src/typescript-generator/generate.js";
import { Repository } from "../../src/typescript-generator/repository.js";

describe("end-to-end test", () => {
  it("generates the same code for pet store that it did on the last test run", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate(
        "./petstore.yaml",
        basePath,
        { routes: true, types: true },
        repository,
      );
      await repository.finished();

      for (const [scriptPath, script] of repository.scripts.entries()) {
        expect(`${scriptPath}:${await script.contents()}`).toMatchSnapshot();
      }

      expect(await $.read(".gitignore")).toMatchSnapshot();

      expect(await $.read(".cache/README.md")).toMatchSnapshot();
    });
  });

  it("generates the same code for the example that it did on the last test run", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate(
        "./test/fixtures/openapi-example.yaml",
        basePath,
        { routes: true, types: true },
        repository,
      );
      await repository.finished();

      for (const [scriptPath, script] of repository.scripts.entries()) {
        expect(`${scriptPath}:${await script.contents()}`).toMatchSnapshot();
      }

      expect(await $.read(".gitignore")).toMatchSnapshot();

      expect(await $.read(".cache/README.md")).toMatchSnapshot();
    });
  });
});

describe("_.context type generation", () => {
  it("generates a fallback _.context.ts when no routes directory exists", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate("./petstore.yaml", basePath, { types: true }, repository);

      const content = await $.read("types/_.context.ts");
      expect(content).toContain("readonly context: Record<string, unknown>");
      expect(content).toContain(
        "loadContext(path: string): Record<string, unknown>;",
      );
      expect(content).not.toContain("import type");
      expect(content).toContain(
        "export type Scenario = ($: Scenario$) => Promise<void> | void;",
      );
      expect(content).toContain("export interface Context$ {");
      expect(content).toContain(
        '  readonly loadContext: LoadContextDefinitions["loadContext"];',
      );
      expect(content).toContain(
        "  readonly readJson: (relativePath: string) => Promise<unknown>;",
      );
    });
  });

  it("generates typed loadContext overloads for a root context file", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await $.add("routes/_.context.ts", "export class Context {}");

      await generate("./petstore.yaml", basePath, { types: true }, repository);

      const content = await $.read("types/_.context.ts");
      expect(content).toContain(
        'import type { Context } from "../routes/_.context";',
      );
      expect(content).toContain("readonly context: Context;");
      expect(content).toContain(
        'loadContext(path: "/" | `/${string}`): Context;',
      );
      expect(content).toContain(
        "loadContext(path: string): Record<string, unknown>;",
      );
    });
  });

  it("generates narrowed overloads for root + subdirectory context files", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await $.add("routes/_.context.ts", "export class Context {}");
      await $.add("routes/pets/_.context.ts", "export class Context {}");

      await generate("./petstore.yaml", basePath, { types: true }, repository);

      const content = await $.read("types/_.context.ts");
      expect(content).toContain(
        'import type { Context } from "../routes/_.context";',
      );
      expect(content).toContain(
        'import type { Context as PetsContext } from "../routes/pets/_.context";',
      );
      expect(content).toContain(
        'loadContext(path: "/pets" | `/pets/${string}`): PetsContext;',
      );
      expect(content).toContain(
        'loadContext(path: "/" | `/${string}`): Context;',
      );
      // Subdirectory overload must appear before root overload for correct resolution
      expect(content.indexOf("PetsContext")).toBeLessThan(
        content.indexOf('"/" |'),
      );
    });
  });

  it("generates overloads for parameterized path context files", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await $.add("routes/_.context.ts", "export class Context {}");
      await $.add(
        "routes/pets/{petId}/_.context.ts",
        "export class Context {}",
      );

      await generate("./petstore.yaml", basePath, { types: true }, repository);

      const content = await $.read("types/_.context.ts");
      expect(content).toContain(
        'import type { Context as PetsPetIdContext } from "../routes/pets/{petId}/_.context";',
      );
      expect(content).toContain(
        "loadContext(path: `/pets/${string}`): PetsPetIdContext;",
      );
    });
  });
});
