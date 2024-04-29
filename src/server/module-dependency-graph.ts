import "./precinct.d.ts";

import { dirname, resolve } from "node:path";

import precinct from "precinct";

export class ModuleDependencyGraph {
  private readonly dependents = new Map<string, Set<string>>();

  public load(path: string) {
    for (const dependency of precinct.paperwork(path)) {
      if (!dependency.startsWith(".")) {
        return;
      }

      const key = resolve(dirname(path), dependency);
      if (!this.dependents.has(key)) {
        this.dependents.set(key, new Set());
      }
      this.dependents.get(key)?.add(path);
    }
  }

  public dependentsOf(path: string) {
    const dependents = new Set(this.dependents.get(path) ?? []);

    for (const file of dependents) {
      for (const secondary of this.dependentsOf(file)) {
        dependents.add(secondary);
      }
    }

    return dependents;
  }
}
