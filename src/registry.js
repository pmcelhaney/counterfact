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

  add(path, module) {
    this.modules[path] = module;

    const segments = path.split("/").slice(1);

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

  remove(path) {
    delete this.modules[path];
  }

  exists(method, path) {
    return Boolean(this.modules[path]?.[method]);
  }

  endpoint(method, path) {
    const module = this.modules[path];
    const lambda = module?.[method];

    if (!lambda) {
      throw new Error(
        `${method} method for endpoint at "${path}" does not exist`
      );
    }

    return lambda;
  }
}
