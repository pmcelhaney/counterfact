import type { RequestMethod } from "./request-method";

export interface Context {
  request: {
    path: string;
    method: RequestMethod;
  };
  status?: number;
  body?: string;
}
