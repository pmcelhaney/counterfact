import { ModuleTree } from "../../src/server/module-tree.js";

function add(
  moduleTree: ModuleTree,
  url: string,
  name: string,
  method: string = "GET",
) {
  const module: { [key: string]: () => { body: string } } = {};
  module[method] = () => ({ body: name });
  moduleTree.add(url, module);
}

function match(moduleTree: ModuleTree, path: string, method: string = "GET") {
  return moduleTree.match(path, method)?.module[method]?.()?.body;
}

it("returns undefined for /", () => {
  const moduleTree = new ModuleTree();

  expect(match(moduleTree, "/")).toBe(undefined);
});

it("finds a file at the root", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  expect(match(moduleTree, "/a")).toBe("a");
});

it("finds a file under a subdirectory", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/b", "b");
  // Should handle differences in case between the path and the module name
  add(moduleTree, "/a/Something", "something");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
  expect(match(moduleTree, "/a/Something")).toBe("something");
});

it("finds a file with a trailing slash in the path", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  expect(match(moduleTree, "/a/")).toBe("a");
});

it("finds a file with a wildcard match", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/{x}", "b", "PUT");
  add(moduleTree, "/a/{y}", "c");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b", "PUT")).toBe("b");
  expect(match(moduleTree, "/a/c")).toBe("c");
});

it("finds a directory with a wildcard match", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  add(moduleTree, "/{x}/b", "b");
  add(moduleTree, "/{y}/c", "c");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
  expect(match(moduleTree, "/a/c")).toBe("c");
});

it("prefers an exact match to a wildcard", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/b", "exact");
  add(moduleTree, "/a/{x}", "wildcard");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("exact");
});

it("is case-insensitive", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/b", "exact");
  add(moduleTree, "/a/{x}", "wildcard");
  expect(match(moduleTree, "/A")).toBe("a");
  expect(match(moduleTree, "/A/B")).toBe("exact");
});

it("captures the path variables", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a/{foo}/{bar}", "wildcard");
  expect(moduleTree.match("/a/b/c", "GET")?.pathVariables).toEqual({
    bar: "c",
    foo: "b",
  });
});

it("captures the matched path", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a/b/c", "simple");
  expect(moduleTree.match("/a/b/c", "GET")?.matchedPath).toEqual("/a/b/c");
});

it("captures the matched path with wildcards", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a/{foo}/{bar}", "wildcard");
  expect(moduleTree.match("/a/b/c", "GET")?.matchedPath).toEqual(
    "/a/{foo}/{bar}",
  );
});

it("removes a module", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/b", "b");
  add(moduleTree, "/c", "c");
  moduleTree.remove("/a/b");
  moduleTree.remove("/c");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe(undefined);
  expect(match(moduleTree, "/c")).toBe(undefined);
});

it("has all of the routes", () => {
  const moduleTree = new ModuleTree();

  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/b", "b");
  add(moduleTree, "/a/{b}", "b");
  add(moduleTree, "/c", "c");
  expect(moduleTree.routes.map((route) => route.path)).toEqual([
    "/a",
    "/a/b",
    "/a/{b}",
    "/c",
  ]);
});

export default ModuleTree;
