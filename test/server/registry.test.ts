import { type Module, Registry } from "../../src/server/registry.js";

function makeModule(name: string): Module {
  return {
    GET() {
      return name;
    },
  };
}

async function identifyModule(
  node: { module?: Module } | undefined,
): Promise<unknown> {
  // eslint-disable-next-line new-cap
  return await node?.module?.GET?.({
    headers: {},
    matchedPath: "",
    path: {},
    query: {},
  });
}

describe("a registry", () => {
  it("knows if a handler exists for a request method at a path", () => {
    const registry = new Registry();

    registry.add("/hello", {
      async GET() {
        await Promise.resolve("noop");

        return { body: "hello", headers: {}, status: 200 };
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

        return "GET a";
      },

      async POST() {
        await Promise.resolve("noop");

        return "POST a";
      },
    });
    registry.add("/b", {
      async GET() {
        await Promise.resolve("noop");

        return "GET b";
      },

      async POST() {
        await Promise.resolve("noop");

        return "POST b";
      },
    });

    const props = {
      context: {},

      headers: {},
      matchedPath: "",
      path: {},

      query: {},
    };
    const getA = await registry.endpoint("GET", "/a")(props);
    const getB = await registry.endpoint("GET", "/b")(props);
    const postA = await registry.endpoint("POST", "/a")(props);
    const postB = await registry.endpoint("POST", "/b")(props);

    expect(getA).toBe("GET a");
    expect(getB).toBe("GET b");
    expect(postA).toBe("POST a");
    expect(postB).toBe("POST b");
  });

  it("constructs a tree of the registered modules", async () => {
    const registry = new Registry();

    registry.add("/nc", makeModule("North Carolina"));
    registry.add("/nc/charlotte/south-park", makeModule("South Park"));
    registry.add("/nc/charlotte", makeModule("Charlotte"));

    expect(await identifyModule(registry.moduleTree.children?.nc)).toBe(
      "North Carolina",
    );
    expect(
      await identifyModule(
        registry.moduleTree.children?.nc?.children?.charlotte,
      ),
    ).toBe("Charlotte");
    expect(
      await identifyModule(
        registry.moduleTree.children?.nc?.children?.charlotte?.children?.[
          "south-park"
        ],
      ),
    ).toBe("South Park");
  });

  it("handles a dynamic path", async () => {
    const registry = new Registry();

    registry.add("/{organization}/users/{username}/friends/{page}", {
      GET({ path }) {
        return {
          body: `page ${String(path.page)} of ${String(
            path.username,
          )}'s friends in ${String(path.organization)}`,

          headers: { "content-type": "text/plain" },

          status: 200,
        };
      },
    });

    expect(
      await registry.endpoint(
        "GET",
        "/acme/users/alice/friends/2",
      )({ headers: {}, matchedPath: "", path: {}, query: {} }),
    ).toStrictEqual({
      body: "page 2 of alice's friends in acme",
      headers: { "content-type": "text/plain" },
      status: 200,
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
