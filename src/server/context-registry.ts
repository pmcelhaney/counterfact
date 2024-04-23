// eslint-disable-next-line max-classes-per-file
export class Context {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor, @typescript-eslint/no-empty-function
  public constructor() {}

  [key: string]: unknown;
}

export function parentPath(path: string): string {
  if (path === "/") {
    throw new Error("root context does not exist!");
  }
  return String(path.split("/").slice(0, -1).join("/")) || "/";
}

export class ContextRegistry {
  private readonly entries = new Map<string, Context>();

  private readonly cache = new Map<string, Context>();

  public loadAfterClear = false;

  public constructor() {
    this.add("/", {});
  }

  public add(path: string, context: Context): void {
    console.log("adding", path);
    this.entries.set(path, context);
    this.cache.set(path, structuredClone(context));
    this.loadAfterClear = true;
  }

  public clear() {
    this.cache.clear();
    this.entries.clear();
    this.add("/", { name: "cleared" });
    this.loadAfterClear = false;
  }

  public find(path: string): Context {
    return this.entries.get(path) ?? this.find(parentPath(path));
  }

  public update(path: string, updatedContext?: Context): void {
    if (updatedContext === undefined) {
      return;
    }

    const context = this.find(path);

    for (const property in updatedContext) {
      if (updatedContext[property] !== this.cache.get(path)?.[property]) {
        context[property] = updatedContext[property];
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.setPrototypeOf(context, Object.getPrototypeOf(updatedContext));

    this.cache.set(path, structuredClone(updatedContext));
  }
}
