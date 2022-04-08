export class Importer {
  constructor() {
    this.paths = {};
  }

  add(path, get) {
    this.paths[path] = get;
  }

  exists(path) {
    return path in this.paths;
  }

  get(path) {
    return this.paths[path].GET;
  }
}
