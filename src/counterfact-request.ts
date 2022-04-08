import type { RequestMethod } from "./request-method";

export interface CounterfactRequest {
  method: RequestMethod;
  path: string;
}
