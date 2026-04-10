import { dereference } from "@apidevtools/json-schema-ref-parser";
import createDebug from "debug";

import type { OpenApiDocument } from "./dispatcher.js";

const debug = createDebug("counterfact:server:load-openapi-document");

export async function loadOpenApiDocument(source: string) {
  try {
    return (await dereference(source)) as OpenApiDocument;
  } catch (error) {
    debug("could not load OpenAPI document from %s: %o", source, error);
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not load the OpenAPI spec from "${source}".\n${details}`,
      { cause: error },
    );
  }
}
