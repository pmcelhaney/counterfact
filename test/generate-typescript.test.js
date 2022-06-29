import { generatePaths } from "../src/generate-typescript.js";

describe("typescript generator", () => {
  it("generates a file for a path", () => {
    const paths = {
      "/pets": {
        get: {
          responses: {
            default: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Pets" },
                },
              },
            },
          },
        },
      },
    };

    const files = generatePaths(paths);

    expect(files).toStrictEqual([
      {
        name: "/pets.ts",

        content: [
          "import type { HTTP_GET } from './pets.types.ts';",
          "",
          "export const GET: HTTP_GET = () => {};",
          "",
        ].join("\n"),
      },

      {
        name: "/pets.types.ts",

        content: [
          "import type { Pets } from ../schemas/Pets.ts;",
          "",
          "export type HTTP_GET = () => { body: Pets; };",
          "",
        ].join("\n"),
      },
    ]);
  });
});
