import { ModuleTree } from "../../src/server/module-tree.js";

function match(moduleTree: ModuleTree, path: string) {
  return moduleTree.match(path).module;
}

it("returns undefined for /", () => {
  const moduleTree = new ModuleTree();
  expect(match(moduleTree, "/")).toBe(undefined);
});

it("finds a file at the root", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  expect(match(moduleTree, "/a")).toBe("a");
});

it("finds a file under a subdirectory", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "b");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
});

it("finds a file with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/{x}", "b");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
});

it("finds a directory with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/{x}/b", "b");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
});

it("prefers an exact match to a wildcard", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "exact");
  moduleTree.add("/a/{x}", "wildcard");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("exact");
});

it("is case-insensitive", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "exact");
  moduleTree.add("/a/{x}", "wildcard");
  expect(match(moduleTree, "/A")).toBe("a");
  expect(match(moduleTree, "/A/B")).toBe("exact");
});

it("captures the path variables", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a/{foo}/{bar}", "wildcard");
  expect(moduleTree.match("/a/b/c").pathVariables).toEqual({
    bar: "c",
    foo: "b",
  });
});

it("removes a module", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "b");
  moduleTree.remove("/a/b");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe(undefined);
});

export default ModuleTree;
