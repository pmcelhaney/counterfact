/* eslint-disable import/group-exports */
import fs from "node:fs/promises";
import { join } from "node:path";

import yaml from "yaml";

function getTypeName(content) {
  if (content?.schema?.$ref) {
    return content.schema.$ref.replace(/^#\/components\/schemas\//u, "");
  }

  return "string";
}

function generateRequestFunction(method, returnTypeName) {
  return `export type HTTP_${method} = () => { body: ${returnTypeName}; };`;
}

function generateOperation(url, method, operation) {
  const returnTypeName = getTypeName(
    operation.responses.default.content["application/json"]
  );

  return [
    {
      name: `${url}.ts`,

      content: `import type { HTTP_${method} } from '.${url}.types.ts';\n\nexport const ${method}: HTTP_${method} = () => {};\n`,
    },
    {
      name: `${url}.types.ts`,

      content: `import type { ${returnTypeName} } from ../schemas/${returnTypeName}.ts;\n\n${generateRequestFunction(
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

export function generatePaths(paths) {
  return Object.entries(paths).flatMap(generatePath);
}

export async function generateTypeScript(pathToOpenApiSpec, targetPath) {
  await fs.mkdir(targetPath, { recursive: true });

  const api = yaml.parse(await fs.readFile(pathToOpenApiSpec, "utf8"));

  const writes = Object.entries(api.paths).map(([path, operations]) =>
    fs.writeFile(join(targetPath, `${path}.types.ts`), operations)
  );

  await Promise.all(writes);
}
