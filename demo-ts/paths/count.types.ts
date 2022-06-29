import type { HttpResponseStatusCode } from "../types/Http";
import type { Context } from "../context/context";

export type HTTP_GET = (request: { context: Context }) => {
  body: string;
  status?: HttpResponseStatusCode;
};
