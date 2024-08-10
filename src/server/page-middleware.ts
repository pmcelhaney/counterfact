import nodePath from "node:path";
import { fileURLToPath } from "node:url";

import createDebug from "debug";
import Handlebars from "handlebars";
import type Koa from "koa";

import { readFile } from "../util/read-file.js";

// eslint-disable-next-line no-underscore-dangle
const __dirname = nodePath.dirname(fileURLToPath(import.meta.url));

const debug = createDebug("counterfact:server:page-middleware");

Handlebars.registerHelper("escape_route", (route: string) =>
   
  route.replaceAll(/[^\w/]/gu, "-"),
);

export function pageMiddleware(
  pathname: string,
  templateName: string,
  locals: { [key: string]: unknown },
) {
  return async (ctx: Koa.ExtendableContext, next: Koa.Next) => {
    const pathToHandlebarsTemplate = nodePath
      .join(__dirname, `../client/${templateName}.html.hbs`)
      .replaceAll("\\", "/");

    const render = Handlebars.compile(await readFile(pathToHandlebarsTemplate));

    if (ctx.URL.pathname === pathname) {
      debug("rendering page: %s", pathname);
      debug("locals: %o", locals);

      ctx.body = render(locals);

      return;
    }

    // eslint-disable-next-line  n/callback-return
    await next();
  };
}
