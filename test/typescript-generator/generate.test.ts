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

describe("group (multi-spec) generation", () => {
  it("generates routes under routes/<group>/ when a group is specified", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate(
        "./petstore.yaml",
        basePath,
        { routes: true, types: true, group: "billing" },
        repository,
      );
      await repository.finished();

      const scriptPaths = Array.from(repository.scripts.keys());

      // Route files should be under routes/billing/
      const routeScripts = scriptPaths.filter((p) => p.startsWith("routes/"));
      expect(routeScripts.length).toBeGreaterThan(0);
      routeScripts.forEach((scriptPath) => {
        expect(scriptPath).toMatch(/^routes\/billing\//);
      });
    });
  });

  it("generates type files under types/<group>/paths/ when a group is specified", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate(
        "./petstore.yaml",
        basePath,
        { routes: true, types: true, group: "billing" },
        repository,
      );
      await repository.finished();

      const scriptPaths = Array.from(repository.scripts.keys());

      // Type files should be under types/billing/paths/
      const typeScripts = scriptPaths.filter(
        (p) => p.startsWith("types/") && p.endsWith(".types.ts"),
      );
      expect(typeScripts.length).toBeGreaterThan(0);
      typeScripts.forEach((scriptPath) => {
        expect(scriptPath).toMatch(/^types\/billing\/paths\//);
      });
    });
  });

  it("generates route files importing types from types/<group>/paths/", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate(
        "./petstore.yaml",
        basePath,
        { routes: true, types: true, group: "billing" },
        repository,
      );
      await repository.finished();

      const scriptPaths = Array.from(repository.scripts.keys());
      const routeScripts = scriptPaths.filter((p) =>
        p.startsWith("routes/billing/"),
      );

      await Promise.all(
        routeScripts.map(async (scriptPath) => {
          const script = repository.scripts.get(scriptPath)!;
          const contents = await script.contents();
          // The type import should reference types/billing/paths/
          expect(contents).toMatch(/types\/billing\/paths/);
        }),
      );
    });
  });

  it("does not generate routes without group prefix when group is specified", async () => {
    await usingTemporaryFiles(async ($) => {
      const basePath = $.path("");
      const repository = new Repository();

      repository.writeFiles = async () => {
        await Promise.resolve(undefined);
      };

      await generate(
        "./petstore.yaml",
        basePath,
        { routes: true, types: true, group: "billing" },
        repository,
      );
      await repository.finished();

      const scriptPaths = Array.from(repository.scripts.keys());

      // Should have no routes/pet.ts, only routes/billing/pet.ts
      const ungroupedRoutes = scriptPaths.filter(
        (p) => p.startsWith("routes/") && !p.startsWith("routes/billing/"),
      );
      expect(ungroupedRoutes).toHaveLength(0);
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
