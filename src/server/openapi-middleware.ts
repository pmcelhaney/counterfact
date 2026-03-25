import yaml from "js-yaml";
import type Koa from "koa";

import { readFile } from "../util/read-file.js";

export function openapiMiddleware(
  openApiPath: string,
  url: string,
  servePath = "/counterfact/openapi",
) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    if (ctx.URL.pathname === servePath) {
      const openApiDocument = (await yaml.load(
        await readFile(openApiPath),
      )) as {
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
