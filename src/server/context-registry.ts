interface Context {
  [key: string]: unknown;
}

function objectHasOwnProperty(
  object: { [key: string]: unknown },
  key: string
): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Object.prototype.hasOwnProperty.call(object, key);
}

export function parentPath(path: string) {
  return String(path.split("/").slice(0, -1).join("/")) || "/";
}

export class ContextRegistry {
  private readonly entries = new Map<string, Context>();

  public constructor() {
    this.add("/", {});
  }

  public add(path: string, context: Context | undefined) {
    if (context === undefined) {
      throw new Error("context cannot be undefined");
    }

    this.entries.set(path, context);
  }

  public find(path: string): Context {
    return this.entries.get(path) ?? this.find(parentPath(path));
  }

  public update(path: string, updatedContext: Context) {
    const context = this.find(path);

    for (const property in updatedContext) {
      if (
        objectHasOwnProperty(updatedContext, property) &&
        !objectHasOwnProperty(context, property)
      ) {
        context[property] = updatedContext[property];
      }
    }

    Object.setPrototypeOf(
      context,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      Object.getPrototypeOf(updatedContext) as Context
    );
  }
}
