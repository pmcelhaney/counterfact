import { dirname, resolve } from "node:path";

import precinct from "precinct";

export class ModuleDependencyGraph {
  private readonly dependents = new Map<string, Set<string>>();

  private loadDependencies(path: string) {
    try {
      return precinct.paperwork(path);
    } catch {
      return [];
    }
  }

  private clearDependents(path: string) {
    this.dependents.forEach((group) => {
      group.delete(path);
    });
  }

  public load(path: string) {
    this.clearDependents(path);

    for (const dependency of this.loadDependencies(path)) {
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
    const marked = new Set<string>();
    const dependents = new Set<string>();
    const queue = [path];

    while (queue.length > 0) {
      const file = queue.shift();

      if (file !== undefined && !marked.has(file)) {
        marked.add(file);

        const fileDependents = this.dependents.get(file);

        if (fileDependents) {
          for (const dependent of fileDependents) {
            dependents.add(dependent);
            queue.push(dependent);
          }
        }
      }
    }

    return dependents;
  }
}
