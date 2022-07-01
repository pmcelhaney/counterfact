import { generateTypeScript } from "./generate-typescript.js";

const [pathToOpenApiSpec, destinationPath] = process.argv.slice(2);

generateTypeScript(pathToOpenApiSpec, destinationPath);
