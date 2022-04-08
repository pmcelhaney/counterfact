import type { RequestMethod } from "./request-method";
import type { Endpoint } from "./endpoint";

export interface Server {
  exists: (method: RequestMethod, path: string) => boolean;

  endpoint: (method: RequestMethod, path: string) => Endpoint;
}
