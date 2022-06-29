import type { Context } from "../../context/context";
import type { HttpResponseStatusCode } from "../../types/Http";
import type { Greeting } from "../../types/Greeting";
import type { HtmlImgTag } from "../../types/HtmlImgTag";

export type Get_name = (request: {
  context: Context;
  query: { greeting?: string };
  path: { name: string };
}) => { body: Greeting; status?: HttpResponseStatusCode };

export type Get_kitty = (request: {
  context: Context;
  query: { greeting?: string };
  path: { name: string };
}) => { body: HtmlImgTag; status?: HttpResponseStatusCode };
