interface ProxyConfig {
  proxyPaths: Map<string, boolean>;
}

export function isProxyEnabledForPath(
  path: string,
  config: ProxyConfig,
): boolean {
  if (config.proxyPaths.has(path)) {
    return config.proxyPaths.get(path) ?? false;
  }

  if (path === "") {
    return false;
  }

  const parentPath = path.slice(0, Math.max(0, path.lastIndexOf("/")));

  return isProxyEnabledForPath(parentPath, config);
}
