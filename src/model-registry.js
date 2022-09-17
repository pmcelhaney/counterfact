export function parentPath(path) {
  return path.split("/").slice(0, -1).join("/");
}

export class ModelRegistry {
  entries = new Map();

  add(path, model) {
    this.entries.set(path, model);
  }

  find(path) {
    if (path === "") {
      return {};
    }

    return this.entries.get(path) ?? this.find(parentPath(path));
  }
}
