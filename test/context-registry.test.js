import { ContextRegistry, parentPath } from "../src/context-registry.js";

describe("moduleRegistry", () => {
  it("finds a context that exactly matches the path", () => {
    const helloModel = { name: "hello" };

    const registry = new ContextRegistry();

    registry.add("/hello", helloModel);

    expect(registry.find("/hello")).toBe(helloModel);
  });

  it("finds a context at a parent path", () => {
    const helloModel = { name: "hello" };

    const registry = new ContextRegistry();

    registry.add("/hello", helloModel);

    expect(registry.find("/hello/world")).toBe(helloModel);
  });

  it("returns an empty object when there is no matching context", () => {
    const helloModel = { name: "hello" };

    const registry = new ContextRegistry();

    registry.add("/hello", helloModel);

    expect(registry.find("/goodbye/world")).toStrictEqual({});
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
