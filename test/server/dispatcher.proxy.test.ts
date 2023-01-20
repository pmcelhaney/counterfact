import { Headers } from "node-fetch";

import { Dispatcher } from "../../src/server/dispatcher.js";
import { ContextRegistry } from "../../src/server/context-registry.js";
import { Registry } from "../../src/server/registry.js";

describe("a dispatcher passes a proxy function to the operation", () => {
  it("passes a proxy function", async () => {
    const registry = new Registry();

    registry.add("/a", {
      GET({ proxy }) {
        return proxy("https://example.com");
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());

    dispatcher.fetch = (url, options) => ({
      status: 200,
      headers: new Headers([["content-type", "application/test"]]),

      text() {
        return `body from ${url}${options.path}`;
      },
    });

    const response = await dispatcher.request({
      method: "GET",
      path: "/a",
    });

    expect(response.body).toBe("body from https://example.com/a");
    expect(response.headers).toStrictEqual({
      "content-type": "application/test",
    });
    expect(response.contentType).toBe("application/test");
    expect(response.status).toBe(200);
  });
});
