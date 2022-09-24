export function parentPath(path) {
  return String(path.split("/").slice(0, -1).join("/")) || "/";
}

export class ModelRegistry {
  entries = new Map();

  constructor() {
    this.add("", {});
    this.add("/", {});
  }

  add(path, model) {
    if (model === undefined) {
      throw new Error("model cannot be undefined");
    }

    this.entries.set(path, model);
  }

  find(path) {
    return this.entries.get(path) ?? this.find(parentPath(path));
  }
}
