export class Dispatcher {
  registry;

  constructor(registry) {
    this.registry = registry;
  }

  async request({ method, path, body, query }) {
    const parts = path.split("/");

    let remainingParts = parts.length;
    let currentPath = "";

    while (remainingParts > 0) {
      currentPath = parts.slice(0, remainingParts).join("/");

      if (this.registry.exists(method, currentPath)) {
        break;
      }

      remainingParts -= 1;
    }

    if (remainingParts === 0) {
      return {
        body: `${method} method for endpoint at "${path}" not found`,
      };
    }

    return await this.registry.endpoint(
      method,
      currentPath
    )({
      path: parts.slice(remainingParts).join("/"),

      reduce: (reducer) => {
        this.registry.store = reducer(this.registry.store);
      },

      store: this.registry.store,
      body,
      query,
    });
  }
}
