export class Context {
  public constructor() {}

  [key: string]: unknown;
}

export function parentPath(path: string): string {
  return String(path.split("/").slice(0, -1).join("/")) || "/";
}

/**
 * Deep-clones an object for caching purposes.
 * Plain objects and class instances have their own enumerable properties
 * recursively cloned (preserving the prototype chain). Functions are copied
 * by reference since they are not structurally comparable data.
 */
function cloneForCache(value: unknown): unknown {
  if (value === null || typeof value === "function") {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return (value as unknown[]).map(cloneForCache);
  }

  const proto = Object.getPrototypeOf(value) as object | null;
  const clone: Record<string, unknown> =
    proto !== null && proto !== Object.prototype
      ? (Object.create(proto) as Record<string, unknown>)
      : {};

  for (const key of Object.keys(value)) {
    clone[key] = cloneForCache((value as Record<string, unknown>)[key]);
  }

  return clone;
}

export class ContextRegistry extends EventTarget {
  private readonly entries = new Map<string, Context>();

  private readonly cache = new Map<string, Context>();

  private readonly seen = new Set<string>();

  public constructor() {
    super();
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

    this.cache.set(path, cloneForCache(context) as Context);

    this.dispatchEvent(new Event("context-changed"));
  }

  /**
   * Removes the context entry for the given path and dispatches a
   * "context-changed" event so that listeners (e.g. the scenario-context type
   * generator) can regenerate type files in response to the removal.
   *
   * @param path - The route path whose context entry should be deleted
   *   (e.g. "/pets").
   */
  public remove(path: string): void {
    this.entries.delete(path);

    this.cache.delete(path);

    this.seen.delete(path);

    this.dispatchEvent(new Event("context-changed"));
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

    this.cache.set(path, cloneForCache(updatedContext) as Context);
  }

  public getAllPaths(): string[] {
    return Array.from(this.entries.keys());
  }

  public getAllContexts(): Record<string, Context> {
    const result: Record<string, Context> = {};

    for (const [path, context] of this.entries.entries()) {
      result[path] = context;
    }

    return result;
  }
}
