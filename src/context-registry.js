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
}
