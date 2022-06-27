import type { Store } from "../../context/Store";
import type { HttpResponseStatusCode } from "../../types/Http";
import type { Greeting } from "../../types/Greeting";
import type { HtmlImgTag } from "../../types/HtmlImgTag";

export type Get_name = (request: {
  store: Store;
  query: { greeting?: string };
  path: { name: string };
}) => { body: Greeting; status?: HttpResponseStatusCode };

export type Get_kitty = (request: {
  store: Store;
  query: { greeting?: string };
  path: { name: string };
}) => { body: HtmlImgTag; status?: HttpResponseStatusCode };
