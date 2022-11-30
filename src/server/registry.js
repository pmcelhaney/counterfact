function castParameters(parameters, parameterTypes) {
  const copy = { ...parameters };

  Object.entries(copy).forEach(([key, value]) => {
    copy[key] =
      parameterTypes?.[key] === "number" ? Number.parseInt(value, 10) : value;
  });

  return copy;
}

function maybe(flag, value) {
  return flag ? [value] : [];
}

function stripBrackets(string) {
  return string.replaceAll(/\{|\}/gu, "");
}

function routesForNode(node) {
  if (!node.children) {
    return [];
  }

  return Object.entries(node.children)
    .flatMap(([segment, child]) => [
      ...maybe(child.module, `/${segment}`),
      ...routesForNode(child).map((route) => `/${segment}${route}`),
    ])
    .sort((segment1, segment2) =>
      stripBrackets(segment1).localeCompare(stripBrackets(segment2))
    );
}

export class Registry {
  modules = {};

  moduleTree = {
    children: {},
  };

  get routes() {
    return routesForNode(this.moduleTree);
  }

  add(url, module) {
    let node = this.moduleTree;

    for (const segment of url.split("/").slice(1)) {
      node.children ??= {};
      node.children[segment] ??= {};
      node = node.children[segment];
    }

    node.module = module;
  }

  remove(url) {
    let node = this.moduleTree;

    for (const segment of url.split("/").slice(1)) {
      node = node?.children?.[segment];

      if (!node) {
        return false;
      }
    }

    delete node.module;

    return true;
  }

  exists(method, url) {
    return Boolean(this.handler(url)?.module?.[method]);
  }

  // eslint-disable-next-line max-statements
  handler(url) {
    let node = this.moduleTree;

    const path = {};

    const matchedParts = [""];

    for (const segment of url.split("/").slice(1)) {
      if (node.children[segment]) {
        node = node.children[segment];
        matchedParts.push(segment);
      } else {
        const dynamicSegment = Object.keys(node.children).find(
          (ds) => ds.startsWith("{") && ds.endsWith("}")
        );

        if (dynamicSegment) {
          const variableName = dynamicSegment.slice(1, -1);

          path[variableName] = segment;

          node = node.children[dynamicSegment];

          matchedParts.push(dynamicSegment);
        }
      }
    }

    return { module: node.module, path, matchedPath: matchedParts.join("/") };
  }

  endpoint(httpRequestMethod, url, parameterTypes = {}) {
    const handler = this.handler(url);
    const execute = handler?.module?.[httpRequestMethod];

    if (!execute) {
      return () => ({
        status: 404,
        body: `Could not find a ${httpRequestMethod} method at ${url}\nGot as far as ${handler.matchedPath}`,
      });
    }

    return ({ ...requestData }) =>
      execute({
        ...requestData,

        header: castParameters(requestData.query, parameterTypes.header),

        query: castParameters(requestData.query, parameterTypes.query),

        path: castParameters(handler.path, parameterTypes.path),

        matchedPath: handler.matchedPath ?? "none",
      });
  }
}
