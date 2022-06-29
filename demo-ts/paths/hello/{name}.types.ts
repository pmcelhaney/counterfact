import type { Context } from "../../context/context";
import type { HttpResponseStatusCode } from "../../types/Http";
import type { Greeting } from "../../types/Greeting";

export type HTTP_GET = (request: {
  context: Context;
  query: { greeting?: string };
  path: { name: string };
}) => { body: Greeting; status?: HttpResponseStatusCode };
