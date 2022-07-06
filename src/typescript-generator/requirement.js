export class Requirement {
  constructor(url, data) {
    this.url = url;

    // deprecated
    this.path = url;

    this.data = data;
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
