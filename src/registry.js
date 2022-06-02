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

  add(path, script) {
    this.modules[path] = script;
    this.moduleTree[path.slice(1)] = {};
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
