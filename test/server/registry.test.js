import { Registry } from "../../src/server/registry.ts";

describe("a registry", () => {
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

      context: {},
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

  it("constructs a tree of the registered modules", () => {
    const registry = new Registry();

    registry.add("/nc", "North Carolina");
    registry.add("/nc/charlotte/south-park", "South Park");
    registry.add("/nc/charlotte", "Charlotte, NC");

    const { nc } = registry.moduleTree.children;
    const { charlotte } = nc.children;
    const southPark = charlotte.children["south-park"];

    expect(nc.module).toBe("North Carolina");
    expect(charlotte.module).toBe("Charlotte, NC");
    expect(southPark.module).toBe("South Park");
  });

  it("handles a dynamic path", () => {
    const registry = new Registry();

    registry.add("/{organization}/users/{username}/friends/{page}", {
      GET({ path }) {
        return {
          body: `page ${path.page} of ${path.username}'s friends in ${path.organization}`,
        };
      },
    });

    expect(
      registry.endpoint("GET", "/acme/users/alice/friends/2")({})
    ).toStrictEqual({
      body: "page 2 of alice's friends in acme",
    });
  });

  it("lists all of the routes", () => {
    const registry = new Registry();

    registry.add("/a", {});
    registry.add("/b", {});
    registry.add("/c", {});
    registry.add("/c/d", {});
    registry.add("/c/d/e/f/g", {});
    registry.add("/a/in/order", {});
    registry.add("/c/a", {});
    registry.add("/c/{b}", {});
    registry.add("/c/c", {});

    expect(registry.routes).toStrictEqual([
      "/a",
      "/a/in/order",
      "/b",
      "/c",
      "/c/a",
      "/c/{b}",
      "/c/c",
      "/c/d",
      "/c/d/e/f/g",
    ]);
  });
});
