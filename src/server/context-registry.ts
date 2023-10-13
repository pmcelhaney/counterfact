export interface Context {
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
      // If $.context.ts exists but only exports a type, then the context object will be undefined here.
      // This should be handled upstream, so that add() is not called in the first place.
      // But module-loader.ts needs to be refactored a bit using type guards and the is operator
      // before that can be done cleanly.
      return;
    }

    this.entries.set(path, context);
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
