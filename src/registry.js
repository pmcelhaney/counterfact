export class Registry {
  modules = {};

  moduleTree = {};

  store;

  constructor(store = {}) {
    this.store = store;
  }

  get modulesList() {
    return Object.keys(this.modules);
  }

  add(url, script) {
    this.modules[url] = script;

    function addToTree(tree, path) {
      if (path.length === 1) {
        return {
          ...tree,
          [path[0]]: { ...tree[path[0]], script },
        };
      }

      return {
        ...tree,

        [path[0]]: {
          children: addToTree(tree[path[0]]?.children ?? {}, path.slice(1)),
        },
      };
    }

    this.moduleTree = addToTree(this.moduleTree, url.split("/").slice(1));
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
