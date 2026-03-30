import { pathToFileURL } from "node:url";

import { bundle } from "@apidevtools/json-schema-ref-parser";
import yaml from "js-yaml";
import type Koa from "koa";

export function openapiMiddleware(openApiPath: string, url: string) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      const resolvedPath = /^https?:\/\/|^file:\/\//.test(openApiPath)
        ? openApiPath
        : pathToFileURL(openApiPath).href;
      const openApiDocument = (await bundle(resolvedPath)) as {
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

      ctx.body = yaml.dump(openApiDocument);

      return;
    }

    await next();
  };
}
