import createDebug from "debug";

import { OpenApiDocument } from "./openapi-document.js";

const debug = createDebug("counterfact:server:load-openapi-document");

export async function loadOpenApiDocument(source: string) {
  const document = new OpenApiDocument(source);

  try {
    await document.load();
  } catch (error) {
    debug("could not load OpenAPI document from %s: %o", source, error);
    throw error;
  }

  return document;
}
