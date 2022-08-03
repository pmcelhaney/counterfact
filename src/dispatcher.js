import { Tools } from "./tools.js";

export class Dispatcher {
  registry;

  constructor(registry) {
    this.registry = registry;
  }

  request({ method, path, headers, body, query }) {
    return this.wrapResponse(
      this.registry.endpoint(
        method,
        path
      )({
        tools: new Tools({ headers }),

        context: this.registry.context,
        body,
        query,
        headers,
      })
    );
  }

  wrapResponse(response) {
    if (typeof response === "string") {
      return {
        status: 200,
        headers: {},
        contentType: "text/plain",
        body: response,
      };
    }

    return response;
  }
}
