import { Headers } from "node-fetch";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { Dispatcher } from "../../src/server/dispatcher.js";
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

    dispatcher.fetch = (url) => ({
      headers: new Headers([["content-type", "application/json"]]),
      status: 200,

      text() {
        return `body from ${url}`;
      },
    });

    const response = await dispatcher.request({
      method: "GET",
      path: "/a",

      req: {
        path: "/a?x=1",
      },
    });

    expect(response.body).toBe("body from https://example.com/a?x=1");
    expect(response.headers).toStrictEqual({
      "content-type": "application/json",
    });
    expect(response.contentType).toBe("application/json");
    expect(response.status).toBe(200);
  });
});
