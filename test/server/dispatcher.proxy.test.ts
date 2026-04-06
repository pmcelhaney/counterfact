import { Headers } from "node-fetch";

import { ContextRegistry } from "../../src/server/context-registry.js";
import { Dispatcher } from "../../src/server/dispatcher.js";
import { Registry } from "../../src/server/registry.js";

describe("a dispatcher passes a proxy function to the operation", () => {
  it("passes a proxy function", async () => {
    const registry = new Registry();

    registry.add("/a", {
      async GET({ proxy }) {
        return await proxy("https://example.com");
      },
    });

    const dispatcher = new Dispatcher(registry, new ContextRegistry());

    dispatcher.fetch = async (url) =>
      /* @ts-expect-error not mocking all properties of fetch response */
      await Promise.resolve({
        headers: new Headers([["content-type", "application/json"]]),
        status: 200,

        async text() {
          return await Promise.resolve(`body from ${url}`);
        },
      });

    /* @ts-expect-error not including all properties of request */
    const response = await dispatcher.request({
      method: "GET",
      path: "/a",

      req: {
        path: "/a?x=1",
      },
    });

    const { body, contentType, headers, status } = response;

    expect(body).toBe("body from https://example.com/a?x=1");
    expect(headers).toStrictEqual({
      "content-type": "application/json",
    });
    expect(contentType).toBe("application/json");
    expect(status).toBe(200);
  });
});
