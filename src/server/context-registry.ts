interface Context {
  [key: string]: unknown;
}

export function parentPath(path: string): string {
  return String(path.split("/").slice(0, -1).join("/")) || "/";
}

export class ContextRegistry {
  private readonly entries = new Map<string, Context>();

  public constructor() {
    this.add("/", {});
  }

  public add(path: string, context?: Context): void {
    if (context === undefined) {
      throw new Error("context cannot be undefined");
    }

    this.entries.set(path, context);
  }

  public find(path: string): Context {
    return this.entries.get(path) ?? this.find(parentPath(path));
  }

  public update(
    path: string,
    updatedContext: { [key: string]: unknown }
  ): void {
    const context = this.find(path);

    for (const property in updatedContext) {
      if (
        Object.prototype.hasOwnProperty.call(updatedContext, property) &&
        !Object.prototype.hasOwnProperty.call(context, property)
      ) {
        context[property] = updatedContext[property];
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    Object.setPrototypeOf(context, Object.getPrototypeOf(updatedContext));
  }
}
