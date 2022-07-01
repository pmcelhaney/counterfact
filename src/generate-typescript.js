import fs from "node:fs/promises";
import { join } from "node:path";

import yaml from "yaml";

class TypeBuilder {
  constructor(api) {
    this.api = api;
  }

  referencedTypes = new Map();

  identifierIndexes = new Map();

  typeFromSchema(schema) {
    if (schema.$ref) {
      return this.referencedType(schema.$ref);
    }

    if (schema.type === "object") {
      return `{ ${Object.entries(schema.properties)
        .map(([key, value]) => `${key}: ${this.typeFromSchema(value)}`)
        .join(", ")} }`;
    }

    return schema.type;
  }

  reserveUniqueIdentifierForUrl(url) {
    const name = url.split("/").pop();

    if (this.identifierIndexes.has(name)) {
      const nextIndex = this.identifierIndexes.get(name) + 1;

      this.identifierIndexes.set(name, nextIndex);

      const uniqueName = `${name}${nextIndex}`;

      this.referencedTypes.set(url, uniqueName);

      return uniqueName;
    }

    this.referencedTypes.set(url, name);

    this.identifierIndexes.set(name, 1);

    return name;
  }

  referencedType(url) {
    if (this.referencedTypes.has(url)) {
      return this.referencedTypes.get(url);
    }

    return this.reserveUniqueIdentifierForUrl(url);
  }

  responseType(operation) {
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

          properties.push(`body: ${this.typeFromSchema(content.schema)}`);

          return `{ ${properties.join(", ")} }`;
        })
      )
      .join(" | ");
  }

  parametersType(parameters) {
    return `{ ${parameters
      .map(
        (parameter) =>
          `${parameter.name}${
            parameter.required ? "" : "?"
          }: ${this.typeFromSchema(parameter.schema)}`
      )
      .join(", ")} }`;
  }

  requestType(operation) {
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
          `${parameterType}: ${this.parametersType(matchingParameters)}`
        );
      }
    });

    if (keys.length === 0) {
      return "";
    }

    return `{ ${keys.join(", ")} } : { ${properties.join(", ")} }`;
  }

  typeDeclarationForRequestMethod(method, operation) {
    return `export type HTTP_${method} = (${this.requestType(
      operation
    )}) => ${this.responseType(operation)};\n`;
  }

  typeDeclarationsForOperations(operations) {
    return Object.entries(operations).flatMap(([method, operation]) =>
      this.typeDeclarationForRequestMethod(method.toUpperCase(), operation)
    );
  }

  typeFromUrl(url) {
    const branches = url.split("/").slice(1);

    let node = this.api;

    for (const branch of branches) {
      node = node[branch];
    }

    return this.typeFromSchema(node);
  }
}

async function writeFileIncludingDirectories(path, content) {
  const partsOfPath = path.split("/");

  const directory = partsOfPath.slice(0, -1).join("/");

  if (directory !== "") {
    await fs.mkdir(partsOfPath.slice(0, -1).join("/"), { recursive: true });
  }

  return fs.writeFile(path, content);
}

export async function generateTypeScript(pathToOpenApiSpec, targetPath) {
  await fs.mkdir(targetPath, { recursive: true });

  const api = yaml.parse(await fs.readFile(pathToOpenApiSpec, "utf8"));
  const writes = Object.entries(api.paths).flatMap(([path, operations]) => {
    const builder = new TypeBuilder(api);

    const typeDeclarations = builder.typeDeclarationsForOperations(operations);

    const internalTypes = Array.from(
      builder.referencedTypes,
      ([url, identifier]) =>
        `type ${identifier} = ${builder.typeFromUrl(url)};\n`
    );

    const content = [...internalTypes, ...typeDeclarations].join("");

    return writeFileIncludingDirectories(
      join(targetPath, `${path}.types.ts`),
      content
    );
  });

  await Promise.all(writes);
}
