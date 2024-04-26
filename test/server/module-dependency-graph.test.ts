
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
      const deps = graph.load($.path("file.js"));
    
      expect(graph.dependentsOf($.path("./other.js"))).toEqual(new Set([$.path("file.js")]));
    });
  });

  it("identifies immediate dependencies", async () => {
    const graph = new ModuleDependencyGraph();

    await usingTemporaryFiles(async ($) => {
      await $.add("file.js", 'import other from "./other.js";');
      const deps = graph.load($.path("file.js"));
    
      expect(graph.dependentsOf($.path("./other.js"))).toEqual(new Set([$.path("file.js")]));
    });
  });

  it("ignores dependencies that are not relative", async () => {
    const graph = new ModuleDependencyGraph();

    await usingTemporaryFiles(async ($) => {
      await $.add("file.js", 'import fs from "node:fs"; import express from "express";');
      const deps = graph.load($.path("file.js"));
  
      expect(graph.dependentsOf($.path("node:fs"))).toEqual(new Set());
    });
  });

  it.todo("finds indirect dependencies");
  it.todo("handles circular dependencies");
  it.todo("ignores a file it can't process due to syntax errors")
  

});
