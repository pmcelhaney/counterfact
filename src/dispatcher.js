export class Dispatcher {
  registry;

  constructor(registry) {
    this.registry = registry;
  }

  request({ method, path, body, query }) {
    return this.registry.endpoint(
      method,
      path
    )({
      // path: parts.slice(remainingParts).join("/"),

      reduce: (reducer) => {
        this.registry.store = reducer(this.registry.store);
      },

      store: this.registry.store,
      body,
      query,
    });
  }
}
