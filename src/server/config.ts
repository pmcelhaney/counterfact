export interface Config {
  adminApiToken?: string;
  alwaysFakeOptionals: boolean;
  basePath: string;
  buildCache: boolean;
  generate: {
    prune?: boolean;
    routes: boolean;
    types: boolean;
  };
  openApiPath: string;
  port: number;
  proxyPaths: Map<string, boolean>;
  proxyUrl: string;
  routePrefix: string;
  startAdminApi: boolean;
  startRepl: boolean;
  startServer: boolean;
  validateRequests: boolean;
  validateResponses: boolean;
  watch: {
    routes: boolean;
    types: boolean;
  };
}
