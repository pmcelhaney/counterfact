import { ModuleTree } from "../../src/server/module-tree.js";

function add(moduleTree: ModuleTree, url: string, name: string) {
  moduleTree.add(url, {
    GET() {
      return { body: name };
    },
  });
}

function match(moduleTree: ModuleTree, path: string) {
  // @ts-expect-error - not creating an entire request object
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions, new-cap
  return moduleTree.match(path).module.GET?.()?.body as string;
}

it("returns undefined for /", () => {
  const moduleTree = new ModuleTree();
  expect(match(moduleTree, "/")).toBe("Not found.");
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
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
});

it("finds a file with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/{x}", "b");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
});

it("finds a directory with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  add(moduleTree, "/a", "a");
  add(moduleTree, "/{x}/b", "b");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("b");
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
  expect(moduleTree.match("/a/b/c").pathVariables).toEqual({
    bar: "c",
    foo: "b",
  });
});

it("removes a module", () => {
  const moduleTree = new ModuleTree();
  add(moduleTree, "/a", "a");
  add(moduleTree, "/a/b", "b");
  moduleTree.remove("/a/b");
  expect(match(moduleTree, "/a")).toBe("a");
  expect(match(moduleTree, "/a/b")).toBe("Not found.");
});

export default ModuleTree;
