import { ContextRegistry, parentPath } from "../src/context-registry.js";

describe("moduleRegistry", () => {
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
    class SingleContext {
      constructor() {
        this.count = 0;
      }

      increment() {
        this.count += 1;
      }
    }

    class DoubleContext {
      constructor() {
        this.count = 0;
      }

      increment() {
        this.count += 2;
      }
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
