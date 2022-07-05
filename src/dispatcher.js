import { Tools } from "./tools.js";

export class Dispatcher {
  registry;

  constructor(registry) {
    this.registry = registry;
  }

  request({ method, path, headers, body, query }) {
    return this.registry.endpoint(
      method,
      path
    )({
      tools: new Tools({ headers }),

      reduce: (reducer) => {
        this.registry.context = reducer(this.registry.context);
      },

      context: this.registry.context,
      body,
      query,
    });
  }
}
