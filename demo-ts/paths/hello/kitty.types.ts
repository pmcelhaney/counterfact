import type { Context } from "../../context/context";
import type { HttpResponseStatusCode } from "../../types/Http";
import type { HtmlImgTag } from "../../types/HtmlImgTag";

export type HTTP_GET = (request: {
  context: Context;
  query: { greeting?: string };
  path: { name: string };
}) => { body: HtmlImgTag; status?: HttpResponseStatusCode };
