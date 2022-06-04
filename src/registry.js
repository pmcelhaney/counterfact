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

    const segments = url.split("/").slice(1);

    this.moduleTree = this.addModuleToTree(this.moduleTree, segments, module);
  }

  addModuleToTree(tree, segments, module) {
    const [head, ...tail] = segments;

    if (tail.length === 0) {
      return {
        ...tree,

        children: {
          ...tree.children,

          [head]: {
            ...tree?.children?.[head],
            module,
          },
        },
      };
    }

    return {
      ...tree,

      children: {
        ...tree?.children,

        [head]: this.addModuleToTree(
          tree?.children?.[head] ?? {},
          tail,
          module
        ),
      },
    };
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
