import { OpenApiDocument } from "./openapi-document.js";

export async function loadOpenApiDocument(source: string) {
  const document = new OpenApiDocument(source);

  await document.load();

  return document;
}
