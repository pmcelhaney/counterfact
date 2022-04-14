import { Dispatcher } from "../src/dispatcher";
import { Registry } from "../src/registry";

describe("a dispatcher", () => {
  it("dispatches a get request to a server and returns the response", async () => {
    const registry = new Registry();

    registry.add("/hello", {
      GET() {
        return {
          body: "hello",
        };
      },
    });

    const dispatcher = new Dispatcher(registry);

    const response = await dispatcher.request({
      method: "GET",
      path: "/hello",
    });

    expect(response.body).toBe("hello");
  });

  it("goes up one level and keeps searching if it doesn't find an exact match", async () => {
    const server = new Registry();

    server.add("/a", {
      GET() {
        return {
          body: "found a match at /a",
        };
      },
    });

    server.add("/a/b", {
      GET() {
        return {
          body: "found a match at /a/b",
        };
      },
    });

    const dispatcher = new Dispatcher(server);

    const response = await dispatcher.request({
      method: "GET",
      path: "/a/b/c/d",
    });

    expect(response.body).toBe("found a match at /a/b");
  });

  it("passes the remainder of the path to the request", async () => {
    const server = new Registry();

    server.add("/a", {
      GET({ path }) {
        return {
          body: `the rest of the path is '${path}'`,
        };
      },
    });

    const dispatcher = new Dispatcher(server);

    const response = await dispatcher.request({
      method: "GET",
      path: "/a/b/c/d",
    });

    expect(response.body).toBe("the rest of the path is 'b/c/d'");
  });
});
