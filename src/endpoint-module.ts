import type { Endpoint } from "./endpoint";

export interface EndpointModule {
  GET?: Endpoint;
  POST?: Endpoint;
  PUT?: Endpoint;
  DELETE?: Endpoint;
}
