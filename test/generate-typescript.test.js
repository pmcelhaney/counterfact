function generateRequestFunction(method, returnTypeName) {
  return `export type HTTP_${method} = () => { body: ${returnTypeName}; };`;
}

function generateOperation(url, method, operation) {
  const { schema } = operation.responses.default.content["application/json"];

  const returnTypeName = schema.$ref.replace(/^#\/components\/schemas\//u, "");

  return [
    {
      name: `${url}.ts`,

      content: `import type { HTTP_${method} } from '.${url}.types.ts';\n\nexport const ${method}: HTTP_${method} = () => {};\n`,
    },
    {
      name: `${url}.types.ts`,

      content: `import type { ${returnTypeName} } from ../schemas/Pets.ts;\n\n${generateRequestFunction(
        method,
        returnTypeName
      )}\n`,
    },
  ];
}

function generatePath([url, path]) {
  return Object.entries(path).flatMap(([method, operation]) =>
    generateOperation(url, method.toUpperCase(), operation)
  );
}

function generatePaths(paths) {
  return Object.entries(paths).flatMap(generatePath);
}

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
