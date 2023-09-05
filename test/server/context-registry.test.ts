import {
  type Context,
  ContextRegistry,
  parentPath,
} from "../../src/server/context-registry.js";

describe("a context registry", () => {
  it("finds a context that exactly matches the path", () => {
    const helloContext = { name: "hello" };

    const registry = new ContextRegistry();

    registry.add("/hello", helloContext);

    expect(registry.find("/hello")).toBe(helloContext);
  });

  it("finds a context at a parent path", () => {
    const helloContext = { name: "hello" };

    const registry = new ContextRegistry();

    registry.add("/hello", helloContext);

    expect(registry.find("/hello/world")).toBe(helloContext);
  });

  it("returns an empty object when there is no matching context", () => {
    const helloContext = { name: "hello" };

    const registry = new ContextRegistry();

    registry.add("/hello", helloContext);

    expect(registry.find("/goodbye/world")).toStrictEqual({});
  });

  it("updates an existing context by changing methods but not properties", () => {
    class SingleContext implements Context {
      public count = 0;

      public increment() {
        this.count += 1;
      }

      [key: string]: unknown;
    }

    class DoubleContext implements Context {
      public count = 0;

      public increment() {
        this.count += 2;
      }

      [key: string]: unknown;
    }

    const originalContext = new SingleContext();

    const registry = new ContextRegistry();

    registry.add("/", originalContext);
    originalContext.increment();

    expect(registry.find("/").count).toBe(1);

    registry.update("/", new DoubleContext());

    expect(registry.find("/").count).toBe(1);

    originalContext.increment();

    expect(registry.find("/").count).toBe(3);
  });
});

describe("parentPath()", () => {
  it("returns the parent path", () => {
    expect(parentPath("/hello/world")).toBe("/hello");
  });

  it("returns '/' when the path is at the root", () => {
    expect(parentPath("/hello")).toBe("/");
  });
});
