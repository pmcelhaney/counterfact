export class Registry {
  modules = {};

  moduleTree = {
    children: {},
  };

  store;

  constructor(store = {}) {
    this.store = store;
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

  handler(url) {
    let node = this.moduleTree;

    const path = {};

    for (const segment of url.split("/").slice(1)) {
      if (node.children[segment]) {
        node = node.children[segment];
      } else {
        const dynamicSegment = Object.keys(node.children).find(
          (ds) => ds.startsWith("[") && ds.endsWith("]")
        );

        if (dynamicSegment) {
          // eslint-disable-next-line no-magic-numbers
          path[dynamicSegment.slice(1, -1)] = segment;

          node = node.children[dynamicSegment];
        }
      }
    }

    return { module: node.module, path };
  }

  endpoint(httpRequestMethod, url) {
    const handler = this.handler(url);
    const lambda = handler?.module?.[httpRequestMethod];

    if (!lambda) {
      throw new Error(
        `${httpRequestMethod} method for endpoint at "${url}" does not exist`
      );
    }

    return ({ ...context }) => lambda({ ...context, path: handler.path });
  }
}
