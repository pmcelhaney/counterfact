import { bundle } from "@apidevtools/json-schema-ref-parser";
import { dump } from "js-yaml";
import type Koa from "koa";

export interface OpenApiDocumentConfig {
  path: string;
  baseUrl: string;
  id?: string;
}

/**
 * Returns a Koa middleware that serves bundled OpenAPI documents as YAML.
 *
 * When `documents` has exactly one entry the document is served at
 * `/counterfact/openapi` (backward-compatible behaviour).
 *
 * When `documents` has more than one entry each document is served at
 * `/counterfact/openapi/{id}` where `id` comes from the corresponding entry.
 *
 * Every served document is augmented with a `servers` entry (OpenAPI 3.x) and
 * a `host` field (OpenAPI 2.x / Swagger) so that the Swagger UI can send
 * requests to the running Counterfact instance.
 *
 * @param documents - Array of document descriptors. Each entry must provide
 *   `path` (file path or URL to the source OpenAPI document) and `baseUrl`
 *   (the base URL to inject, e.g. `"//localhost:3100/api"`). An optional `id`
 *   string is used to build the per-document URL when more than one document
 *   is present.
 * @returns A Koa middleware function.
 */
export function openapiMiddleware(documents: OpenApiDocumentConfig[]) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    let matched: OpenApiDocumentConfig | undefined;

    if (documents.length === 1) {
      if (ctx.URL.pathname === "/counterfact/openapi") {
        matched = documents[0];
      }
    } else {
      matched = documents.find(
        (doc) => ctx.URL.pathname === `/counterfact/openapi/${doc.id}`,
      );
    }

    if (matched) {
      const openApiDocument = (await bundle(matched.path)) as {
        host?: string;
        servers?: { description: string; url: string }[];
      };

      openApiDocument.servers ??= [];

      openApiDocument.servers.unshift({
        description: "Counterfact",
        url: matched.baseUrl,
      });

      // OpenApi 2 support:
      openApiDocument.host = matched.baseUrl;

      ctx.body = dump(openApiDocument);

      return;
    }

    await next();
  };
}
