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
    const registry = new Registry();

    registry.add("/a", {
      GET() {
        return {
          body: "found a match at /a",
        };
      },
    });

    registry.add("/a/b", {
      GET() {
        return {
          body: "found a match at /a/b",
        };
      },
    });

    const dispatcher = new Dispatcher(registry);

    const response = await dispatcher.request({
      method: "GET",
      path: "/a/b/c/d",
    });

    expect(response.body).toBe("found a match at /a/b");
  });

  it("passes the remainder of the path to the request", async () => {
    const registry = new Registry();

    registry.add("/a", {
      GET({ path }) {
        return {
          body: `the rest of the path is '${path}'`,
        };
      },
    });

    const dispatcher = new Dispatcher(registry);

    const response = await dispatcher.request({
      method: "GET",
      path: "/a/b/c/d",
    });

    expect(response.body).toBe("the rest of the path is 'b/c/d'");
  });

  it("passes a reducer function that can be used to read / update the state", async () => {
    const registry = new Registry({ value: 0 });

    registry.add("/increment", {
      GET({ reduce, path }) {
        const amountToIncrement = Number.parseInt(path, 10);
        reduce((state) => ({
          value: (state as { value: number }).value + amountToIncrement,
        }));
        return { body: "incremented" };
      },
    });

    const dispatcher = new Dispatcher(registry);
    await dispatcher.request({
      method: "GET",
      path: "/increment/1",
    });

    expect(registry.state.value).toBe(1);

    await dispatcher.request({
      method: "GET",
      path: "/increment/2",
    });

    expect(registry.state.value).toBe(3);
  });
});
