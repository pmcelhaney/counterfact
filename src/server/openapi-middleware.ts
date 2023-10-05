import yaml from "js-yaml";
import type Koa from "koa";

import { readFile } from "../util/read-file.js";

export function openapiMiddleware(openApiPath: string, url: string) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    if (ctx.URL.pathname === "/counterfact/openapi") {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
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

      // eslint-disable-next-line require-atomic-updates
      ctx.body = yaml.dump(openApiDocument);

      return;
    }

    // eslint-disable-next-line  n/callback-return
    await next();
  };
}
