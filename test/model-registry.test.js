import { ModelRegistry, parentPath } from "../src/model-registry.js";

describe("moduleRegistry", () => {
  it("finds a model that exactly matches the path", () => {
    const helloModel = { name: "hello" };

    const registry = new ModelRegistry();

    registry.add("/hello", helloModel);

    expect(registry.find("/hello")).toBe(helloModel);
  });

  it("finds a model at a parent path", () => {
    const helloModel = { name: "hello" };

    const registry = new ModelRegistry();

    registry.add("/hello", helloModel);

    expect(registry.find("/hello/world")).toBe(helloModel);
  });

  it("returns an empty object when there is no matching model", () => {
    const helloModel = { name: "hello" };

    const registry = new ModelRegistry();

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
