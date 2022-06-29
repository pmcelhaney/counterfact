export class Registry {
  modules = {};

  moduleTree = {
    children: {},
  };

  context;

  constructor(context = {}) {
    this.context = context;
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
          // eslint-disable-next-line no-magic-numbers
          path[dynamicSegment.slice(1, -1)] = segment;

          node = node.children[dynamicSegment];

          matchedParts.push(dynamicSegment);
        }
      }
    }

    return { module: node.module, path, matchedPath: matchedParts.join("/") };
  }

  endpoint(httpRequestMethod, url) {
    const handler = this.handler(url);
    const lambda = handler?.module?.[httpRequestMethod];

    if (!lambda) {
      return () => ({
        status: 404,
        body: `Could not find a ${httpRequestMethod} method at ${url}\nGot as far as ${handler.matchedPath}`,
      });
    }

    return ({ ...context }) => lambda({ ...context, path: handler.path });
  }
}
