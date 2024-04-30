import { usingTemporaryFiles } from "using-temporary-files";

import { CodeGenerator } from "../../src/server/code-generator.js";
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
  it("generates code for a component", async () => {
    await usingTemporaryFiles(async ({ add, path, read }) => {
      await add("openapi.json", JSON.stringify(OPENAPI));
      const generator = new CodeGenerator(
        path("./openapi.json"),
        path("./out"),
      );

      await generator.watch();

      const exampleComponent = await read("./out/components/Example.ts");

      await generator.stopWatching();

      expect(exampleComponent).toContain("export type Example = string;\n");
    });
  });

  it("updates the code when the spec changes", async () => {
    await usingTemporaryFiles(async ({ add, path, read }) => {
      await add("openapi.json", JSON.stringify(OPENAPI));
      const generator = new CodeGenerator(
        path("./openapi.json"),
        path("./out"),
      );

      const changed = { ...OPENAPI };
      changed.components.schemas.Example.type = "integer";

      await generator.watch();

      await add("openapi.json", JSON.stringify(changed));

      await waitForEvent(generator, "generate");

      const exampleComponent = await read("./out/components/Example.ts");

      await generator.stopWatching();

      expect(exampleComponent).toContain("export type Example = number;\n");
    });
  });
});
