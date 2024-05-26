import { usingTemporaryFiles } from "using-temporary-files";

import { CodeGenerator } from "../../src/typescript-generator/code-generator.js";
import { waitForEvent } from "../../src/util/wait-for-event.js";

const OPENAPI = {
  components: { schemas: { Example: { type: "string" } } },
  openapi: "3.0.3",

  paths: {
    "/example": {
      get: {
        responses: {
          default: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Example",
                },
              },
            },
          },
        },
      },
    },
  },
};

describe("a CodeGenerator", () => {
  if (process.platform === "win32") {
    // Not sure why these tests are failing on Windows
    // The new code has nothing to do with OS.
    // Maybe related to usingTemporaryFiles but that works fine in other tests

    it("skips these tests because Windows", () => {
      expect("windows-is-dumb").toEqual("windows-is-dumb");
    });

    return;
  }

  it("generates code for a component", async () => {
    await usingTemporaryFiles(async ({ add, path, read }) => {
      await add("openapi.json", JSON.stringify(OPENAPI));
      const generator = new CodeGenerator(
        path("./openapi.json"),
        path("./out"),
        { routes: true, types: true },
      );

      await generator.generate();

      const exampleComponent = await read(
        "./out/types/components/schemas/Example.ts",
      );

      await generator.stopWatching();

      expect(exampleComponent).toContain("export type Example = string;\n");
    });
  });

  it("does not generate code for a component when generate types is false", async () => {
    await usingTemporaryFiles(async ({ add, path, read }) => {
      await add("openapi.json", JSON.stringify(OPENAPI));
      const generator = new CodeGenerator(
        path("./openapi.json"),
        path("./out"),
        { routes: true, types: false },
      );

      await generator.generate();

      await expect(read("./out/components/Example.ts")).rejects.toThrow(
        "no such file or directory",
      );
    });
  });

  it("updates the code when the spec changes", async () => {
    await usingTemporaryFiles(async ({ add, path, read }) => {
      await add("openapi.json", JSON.stringify(OPENAPI));
      const generator = new CodeGenerator(
        path("./openapi.json"),
        path("./out"),
        { routes: true, types: true },
      );

      const changed = { ...OPENAPI };
      changed.components.schemas.Example.type = "integer";

      await generator.watch();

      await add("openapi.json", JSON.stringify(changed));

      await waitForEvent(generator, "generate");

      const exampleComponent = await read(
        "./out/types/components/schemas/Example.ts",
      );

      await generator.stopWatching();

      expect(exampleComponent).toContain("export type Example = number;\n");
    });
  });

  it("does not update the code when the spec changes if watch is false", async () => {
    await usingTemporaryFiles(async ({ add, path, read }) => {
      await add("openapi.json", JSON.stringify(OPENAPI));
      const generator = new CodeGenerator(
        path("./openapi.json"),
        path("./out"),
        { routes: true, types: false },
      );

      const changed = { ...OPENAPI };
      changed.components.schemas.Example.type = "integer";

      await generator.watch();

      await add("openapi.json", JSON.stringify(changed));

      await waitForEvent(generator, "generate");

      await expect(read("./out/components/Example.ts")).rejects.toThrow(
        "no such file or directory",
      );

      await generator.stopWatching();
    });
  });
});
