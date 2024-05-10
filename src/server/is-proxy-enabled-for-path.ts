import type { Config } from "./config.js";

export function isProxyEnabledForPath(path: string, config: Config) {
  return config.proxyEnabled;
}
