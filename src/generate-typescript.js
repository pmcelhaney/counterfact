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

function responseType(operation) {
  return Object.entries(operation.responses)
    .flatMap(([statusCode, response]) =>
      Object.entries(response.content).map(([contentType, content]) => {
        const properties = [];

        if (statusCode !== "default") {
          properties.push(`status: ${statusCode}`);
        }

        if (contentType !== "*/*") {
          properties.push(`contentType: "${contentType}"`);
        }

        properties.push(`body: ${content.schema.type}`);

        return `{ ${properties.join(", ")} }`;
      })
    )
    .join(" | ");
}

function parametersType(parameters) {
  return `{ ${parameters
    .map(
      (parameter) =>
        `${parameter.name}${parameter.required ? "" : "?"}: ${
          parameter.schema.type
        }`
    )
    .join(", ")} }`;
}

function requestType(operation) {
  const parameterTypes = ["query", "path"];

  const properties = [];

  const keys = [];

  parameterTypes.forEach((parameterType) => {
    const matchingParameters = (operation.parameters ?? []).filter(
      (parameter) => parameter.in === parameterType
    );

    if (matchingParameters.length > 0) {
      keys.push(parameterType);
      properties.push(
        `${parameterType}: ${parametersType(matchingParameters)}`
      );
    }
  });

  if (keys.length === 0) {
    return "";
  }

  return `{ ${keys.join(", ")} } : { ${properties.join(", ")} }`;
}

function typeDeclarationForRequestMethod(method, operation) {
  return `export type HTTP_${method} = (${requestType(
    operation
  )}) => ${responseType(operation)};`;
}

function typeDeclarationsForOperations(operations) {
  return Object.entries(operations).flatMap(([method, operation]) =>
    typeDeclarationForRequestMethod(method.toUpperCase(), operation)
  );
}

async function writeFileIncludingDirectories(path, content) {
  const partsOfPath = path.split("/");

  const directory = partsOfPath.slice(0, -1).join("/");

  if (directory !== "") {
    await fs.mkdir(partsOfPath.slice(0, -1).join("/"), { recursive: true });
  }

  return fs.writeFile(path, content);
}

export function generatePaths(paths) {
  return Object.entries(paths).flatMap(generatePath);
}

export async function generateTypeScript(pathToOpenApiSpec, targetPath) {
  await fs.mkdir(targetPath, { recursive: true });

  const api = yaml.parse(await fs.readFile(pathToOpenApiSpec, "utf8"));
  const writes = Object.entries(api.paths).flatMap(([path, operations]) =>
    writeFileIncludingDirectories(
      join(targetPath, `${path}.types.ts`),
      `${typeDeclarationsForOperations(operations).join("\n")}\n`
    )
  );

  await Promise.all(writes);
}
