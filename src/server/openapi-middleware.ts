import { bundle } from "@apidevtools/json-schema-ref-parser";
import { dump } from "js-yaml";
import type Koa from "koa";

/**
 * Returns a Koa middleware that serves the bundled OpenAPI document as YAML at
 * `/counterfact/openapi`.
 *
 * The document is augmented with a `servers` entry (OpenAPI 3.x) and a `host`
 * field (OpenAPI 2.x / Swagger) so that the Swagger UI can send requests to
 * the running Counterfact instance.
 *
 * @param openApiPath - Path or URL to the source OpenAPI document.
 * @param url - The base URL to inject (e.g. `"//localhost:3100/api"`).
 * @returns A Koa middleware function.
 */
export function openapiMiddleware(openApiPath: string, url: string) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      const openApiDocument = (await bundle(openApiPath)) as {
        host?: string;
        servers?: { description: string; url: string }[];
      };

      openApiDocument.servers ??= [];

      openApiDocument.servers.unshift({
        description: "Counterfact",
        url,
      });

      // OpenApi 2 support:
      openApiDocument.host = url;

      ctx.body = dump(openApiDocument);

      return;
    }

    await next();
  };
}
