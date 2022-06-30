import {
  generatePaths,
  generateTypeScript,
} from "../src/generate-typescript.js";

import { withTemporaryFiles } from "./lib/with-temporary-files.js";

function unindent([inputString]) {
  const middleLines = `\n${inputString.split("\n").slice(1, -1).join("\n")}\n`;

  const indent = middleLines
    .match(/\n\s+/gu)
    .reduce((currentLine, nextLine) =>
      currentLine.length <= nextLine.length ? currentLine : nextLine
    );

  return middleLines.replaceAll(indent, "\n").slice(1);
}

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
              parameters:
              - in: query
                name: filter
                required: false
                schema:
                  type: string
                description: a query string parameter
              responses:
                200:
                  description: 200 for GET
                  content:
                    "*/*":
                      schema: 
                        type: string
                default:
                  description: default for GET
                  content:
                    "*/*":
                      schema: 
                        type: string
                    "application/json":
                      schema: 
                        type: number
            post:
              responses:
                default:
                    description: Hello world
                    content:
                      "*/*":
                        schema:  
                          type: number
      `,
    };

    await withTemporaryFiles(files, async (temporaryDirectory, { read }) => {
      await generateTypeScript(
        `${temporaryDirectory}/openapi.yaml`,
        `${temporaryDirectory}paths`
      );

      await expect(read("paths/hello.types.ts")).resolves.toBe(unindent`
         export type HTTP_GET = ({ query } : { query: { filter: string } }) => { status: 200, body: string } | { body: string } | { contentType: "application/json", body: number };
         export type HTTP_POST = () => { body: number };
      `);
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
