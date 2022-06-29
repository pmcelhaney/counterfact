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
        this.registry.context = reducer(this.registry.context);
      },

      context: this.registry.context,
      body,
      query,
    });
  }
}
