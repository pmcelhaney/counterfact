import { usingTemporaryFiles } from "using-temporary-files";

import { ModuleDependencyGraph } from "../../src/server/module-dependency-graph.js";

describe("module dependency graph", () => {
  it("identifies a file that has no dependents", () => {
    const graph = new ModuleDependencyGraph();
    expect(graph.dependentsOf("file.js")).toEqual(new Set());
  });

  it("identifies immediate dependencies", async () => {
    const graph = new ModuleDependencyGraph();

    await usingTemporaryFiles(async ($) => {
      await $.add("file.js", 'import other from "./other.js";');
      graph.load($.path("file.js"));

      expect(graph.dependentsOf($.path("./other.js"))).toEqual(
        new Set([$.path("file.js")]),
      );
    });
  });

  it("identifies immediate dependencies", async () => {
    const graph = new ModuleDependencyGraph();

    await usingTemporaryFiles(async ($) => {
      await $.add("file.js", 'import other from "./other.js";');
      graph.load($.path("file.js"));

      expect(graph.dependentsOf($.path("./other.js"))).toEqual(
        new Set([$.path("file.js")]),
      );
    });
  });

  it("ignores dependencies that are not relative", async () => {
    const graph = new ModuleDependencyGraph();

    await usingTemporaryFiles(async ($) => {
      await $.add(
        "file.js",
        'import fs from "node:fs"; import express from "express";',
      );
      graph.load($.path("file.js"));

      expect(graph.dependentsOf($.path("node:fs"))).toEqual(new Set());
    });
  });

  it("finds indirect dependencies", async () => {
    const graph = new ModuleDependencyGraph();

    await usingTemporaryFiles(async ($) => {
      await $.add(
        "file.js",
        'import intermediate from "./intermediate.js"; import other from "./other.js";',
      );
      await $.add("intermediate.js", 'import leaf from "./leaf.js";');
      await $.add("other.js", 'import leaf from "./leaf.js";');

      graph.load($.path("file.js"));
      graph.load($.path("intermediate.js"));
      graph.load($.path("other.js"));

      expect(graph.dependentsOf($.path("./leaf.js"))).toEqual(
        new Set([
          $.path("file.js"),
          $.path("intermediate.js"),
          $.path("other.js"),
        ]),
      );
    });
  });
  it.todo("handles circular dependencies");
  it.todo("ignores a file it can't process due to syntax errors");
});
