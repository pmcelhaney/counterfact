import { ModuleTree } from "../../src/server/module-tree.js";

it("returns undefined for /", () => {
  const moduleTree = new ModuleTree();
  expect(moduleTree.match("/").module).toBe(undefined);
});

it("finds a file at the root", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  expect(moduleTree.match("/a").module).toBe("a");
});

it("finds a file under a subdirectory", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "b");
  expect(moduleTree.match("/a").module).toBe("a");
  expect(moduleTree.match("/a/b").module).toBe("b");
});

it("finds a file with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/{x}", "b");
  expect(moduleTree.match("/a").module).toBe("a");
  expect(moduleTree.match("/a/b").module).toBe("b");
});

it("finds a directory with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/{x}/b", "b");
  expect(moduleTree.match("/a").module).toBe("a");
  expect(moduleTree.match("/a/b").module).toBe("b");
});

it("prefers an exact match to a wildcard", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "exact");
  moduleTree.add("/a/{x}", "wildcard");
  expect(moduleTree.match("/a").module).toBe("a");
  expect(moduleTree.match("/a/b").module).toBe("exact");
});

it("is case-insensitive", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "exact");
  moduleTree.add("/a/{x}", "wildcard");
  expect(moduleTree.match("/A").module).toBe("a");
  expect(moduleTree.match("/A/B").module).toBe("exact");
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
  expect(moduleTree.match("/a").module).toBe("a");
  expect(moduleTree.match("/a/b").module).toBe(undefined);
});

export default ModuleTree;
