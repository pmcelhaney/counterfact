function addNodeToTree(tree, edges, node) {
  const [head, ...tail] = edges;

  if (tail.length === 0) {
    return {
      ...tree,

      children: {
        ...tree.children,

        [head]: {
          ...tree?.children?.[head],
          ...node,
        },
      },
    };
  }

  return {
    ...tree,

    children: {
      ...tree?.children,

      [head]: addNodeToTree(tree?.children?.[head] ?? {}, tail, node),
    },
  };
}

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

    this.moduleTree = addNodeToTree(this.moduleTree, url.split("/").slice(1), {
      module,
    });
  }

  remove(url) {
    delete this.modules[url];
  }

  exists(method, url) {
    return Boolean(this.modules[url]?.[method]);
  }

  endpoint(httpRequestMethod, url) {
    const module = this.modules[url];
    const lambda = module?.[httpRequestMethod];

    if (!lambda) {
      throw new Error(
        `${httpRequestMethod} method for endpoint at "${url}" does not exist`
      );
    }

    return lambda;
  }
}
