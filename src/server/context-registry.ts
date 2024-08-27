import cloneDeep from "lodash/cloneDeep.js";

export class Context {
  public constructor() {}

  [key: string]: unknown;
}

export function parentPath(path: string): string {
  return String(path.split("/").slice(0, -1).join("/")) || "/";
}

export class ContextRegistry {
  private readonly entries = new Map<string, Context>();

  private readonly cache = new Map<string, Context>();

  private readonly seen = new Set<string>();

  public constructor() {
    this.add("/", {});
  }

  private getContextIgnoreCase(map: Map<string, Context>, key: string) {
    const lowerCaseKey = key.toLowerCase();

    for (const currentKey of map.keys()) {
      if (currentKey.toLowerCase() === lowerCaseKey) {
        return map.get(currentKey);
      }
    }

    return undefined;
  }

  public add(path: string, context: Context): void {
    this.entries.set(path, context);

    this.cache.set(path, cloneDeep(context));
  }

  public find(path: string): Context {
    return (
      this.getContextIgnoreCase(this.entries, path) ??
      this.find(parentPath(path))
    );
  }

  public update(path: string, updatedContext?: Context): void {
    if (updatedContext === undefined) {
      return;
    }

    if (!this.seen.has(path)) {
      this.seen.add(path);
      this.add(path, updatedContext);

      return;
    }

    const context = this.find(path);

    for (const property in updatedContext) {
      if (updatedContext[property] !== this.cache.get(path)?.[property]) {
        context[property] = updatedContext[property];
      }
    }

    Object.setPrototypeOf(context, Object.getPrototypeOf(updatedContext));

    this.cache.set(path, cloneDeep(updatedContext));
  }
}
