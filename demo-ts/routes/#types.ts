import type { HttpResponseStatusCode } from "../types/Http";
import type { Store } from "../context/Store";

export type Get_count = (request: { store: Store }) => {
  body: string;
  status?: HttpResponseStatusCode;
};
