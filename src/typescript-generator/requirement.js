export class Requirement {
  constructor(specification, url, data) {
    this.specification = specification;
    this.url = url;
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

  read() {
    return this.load();
  }

  reference(relativeUrl) {
    return this.specification.requirementAt(relativeUrl, this.url);
  }

  item(name) {
    const data = this.data === undefined ? undefined : this.data[name];

    return new Requirement(this.specification, `${this.url}/${name}`, data);
  }
}
