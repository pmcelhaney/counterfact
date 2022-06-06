export class Registry {
  modules = {};

  moduleTree = {
    children: {},
  };

  store;

  constructor(store = {}) {
    this.store = store;
  }

  get modulesList() {
    return Object.keys(this.modules);
  }

  add(url, module) {
    this.modules[url] = module;

    let node = this.moduleTree;

    for (const segment of url.split("/").slice(1)) {
      node.children ??= {};
      node.children[segment] ??= {};
      node = node.children[segment];
    }

    node.module = module;
  }

  remove(url) {
    delete this.modules[url];
  }

  exists(method, url) {
    return Boolean(this.modules[url]?.[method]);
  }

  handler(url) {
    let node = this.moduleTree;

    const pathParameters = {};

    for (const segment of url.split("/").slice(1)) {
      if (node.children[segment]) {
        node = node.children[segment];
      } else {
        const dynamicSegment = Object.keys(node.children).find(
          (ds) => ds.startsWith("[") && ds.endsWith("]")
        );

        pathParameters[dynamicSegment.slice(1, -1)] = segment;

        node = node.children[dynamicSegment];
      }
    }

    return { module: node.module, pathParameters };
  }

  endpoint(httpRequestMethod, url) {
    const handler = this.handler(url);
    const lambda = handler?.module?.[httpRequestMethod];

    if (!lambda) {
      throw new Error(
        `${httpRequestMethod} method for endpoint at "${url}" does not exist`
      );
    }

    return ({ ...context }) =>
      lambda({ ...context, pathParameters: handler.pathParameters });
  }
}
