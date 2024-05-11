export interface Config {
  basePath: string;
  generate: {
    routes: boolean;
    types: boolean;
  };
  openApiPath: string;
  port: number;
  proxyEnabled: boolean;
  proxyPaths: Map<string, boolean>;
  proxyUrl: string;
  routePrefix: string;
  startRepl: boolean;
  startServer: boolean;
  watch: {
    routes: boolean;
    types: boolean;
  };
}

export const DUMMY_EXPORT_FOR_TEST_COVERAGE = 1;
