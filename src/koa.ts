import type { RequestMethod } from "./request-method";

export interface Context {
  request: {
    path: string;
    method: RequestMethod;

    body?: any;
  };
  status?: number;
  body?: string;
}
