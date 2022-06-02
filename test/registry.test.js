import { Registry } from "../src/registry.js";

describe("a scripted server", () => {
  it("knows if a handler exists for a request method at a path", () => {
    const registry = new Registry();

    registry.add("/hello", {
      async GET() {
        await Promise.resolve("noop");

        return { body: "hello" };
      },
    });

    expect(registry.exists("GET", "/hello")).toBe(true);
    expect(registry.exists("POST", "/hello")).toBe(false);
    expect(registry.exists("GET", "/goodbye")).toBe(false);
  });

  it.todo("returns debug information if path does not exist");

  it("returns a function matching the URL and request method", async () => {
    const registry = new Registry();

    registry.add("/a", {
      async GET() {
        await Promise.resolve("noop");

        return { body: "GET a" };
      },

      async POST() {
        await Promise.resolve("noop");

        return { body: "POST a" };
      },
    });
    registry.add("/b", {
      async GET() {
        await Promise.resolve("noop");

        return { body: "GET b" };
      },

      async POST() {
        await Promise.resolve("noop");

        return { body: "POST b" };
      },
    });

    const props = {
      path: "",

      reduce(foo) {
        return foo;
      },

      store: {},
    };
    const getA = await registry.endpoint("GET", "/a")(props);
    const getB = await registry.endpoint("GET", "/b")(props);
    const postA = await registry.endpoint("POST", "/a")(props);
    const postB = await registry.endpoint("POST", "/b")(props);

    expect(getA.body).toBe("GET a");
    expect(getB.body).toBe("GET b");
    expect(postA.body).toBe("POST a");
    expect(postB.body).toBe("POST b");
  });

  it("builds a module tree", () => {
    const registry = new Registry();

    registry.add("/bar", { GET: "GET /bar" });
    registry.add("/foo/bar/baz", { GET: "GET /foo/bar/baz" });
    registry.add("/foo/bar/bop", { GET: "GET /foo/bar/bop" });
    registry.add("/foo", { GET: "GET /foo" });

    expect(registry.moduleTree).toStrictEqual({
      foo: {
        script: {
          GET: "GET /foo",
        },

        children: {
          bar: {
            children: {
              baz: {
                script: {
                  GET: "GET /foo/bar/baz",
                },
              },

              bop: {
                script: {
                  GET: "GET /foo/bar/bop",
                },
              },
            },
          },
        },
      },

      bar: {
        script: {
          GET: "GET /bar",
        },
      },
    });
  });

  it("handles dynamic routes", async () => {
    const registry = new Registry();

    registry.add("/user/[user_id]", {
      GET() {
        return { body: "GET user_id" };
      },
    });

    const context = {
      path: "",

      reduce(foo) {
        return foo;
      },

      store: {},
    };
    const response = await registry.endpoint("GET", "/user/[user_id]")(context);

    expect(response).toStrictEqual({ body: "GET user_id" });
  });
});
