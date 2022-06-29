import type { HttpResponseStatusCode } from "../types/Http";
import type { Context } from "../context/context";

export type Get_count = (request: { context: Context }) => {
  body: string;
  status?: HttpResponseStatusCode;
};
