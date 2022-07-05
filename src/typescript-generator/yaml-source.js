export class YamlSource {
  constructor(path) {
    this.path = path;
  }

  get isLoaded() {
    return this.data !== undefined;
  }

  async load() {
    if (this.isLoaded) {
      return this.data;
    }

    await Promise.resolve("todo -- load and parse YAML");

    throw new Error("Loading a YAML file is not implemented yet.");
  }
}
