export function parentPath(path) {
  return String(path.split("/").slice(0, -1).join("/")) || "/";
}

export class ContextRegistry {
  entries = new Map();

  constructor() {
    this.add("/", {});
  }

  add(path, context) {
    if (context === undefined) {
      throw new Error("context cannot be undefined");
    }

    this.entries.set(path, context);
  }

  find(path) {
    return this.entries.get(path) ?? this.find(parentPath(path));
  }

  update(path, updatedContext) {
    const context = this.find(path);

    for (const property in updatedContext) {
      if (
        Object.prototype.hasOwnProperty.call(updatedContext, property) &&
        !Object.prototype.hasOwnProperty.call(context, property)
      ) {
        context[property] = updatedContext[property];
      }
    }

    Object.setPrototypeOf(context, Object.getPrototypeOf(updatedContext));
  }
}
