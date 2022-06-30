import {
  generatePaths,
  generateTypeScript,
} from "../src/generate-typescript.js";

import { withTemporaryFiles } from "./lib/with-temporary-files.js";

describe("typescript generator", () => {
  it("creates TypeScript from an openapi.yaml file", async () => {
    const files = {
      "openapi.yaml": `
        openapi: 3.0.0
        info:
          title: Integration test example
          description: Example for integration test
          version: 0.0.1 
        paths:
          /hello: 
            get:
              responses:
                200:
                  description: Hello world
                  content:
                    text/plain:
                      schema: string
            post:
              responses:
                200:
                  description: Hello world
                  content:
                    text/plain:
                      schema: string
      `,
    };

    await withTemporaryFiles(files, async (temporaryDirectory, { read }) => {
      await generateTypeScript(
        `${temporaryDirectory}/openapi.yaml`,
        `${temporaryDirectory}paths`
      );

      await expect(read("paths/hello.types.ts")).resolves.toBe(
        "export type HTTP_GET = () => {};\nexport type HTTP_POST = () => {};\n"
      );
    });
  });

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
