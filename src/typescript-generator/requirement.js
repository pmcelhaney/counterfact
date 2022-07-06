export class Requirement {
  constructor(specification, url, data) {
    this.specification = specification;
    this.url = url;
    this.data = data;
  }

  get isLoaded() {
    return this.data !== undefined;
  }

  async read() {
    if (!this.isLoaded) {
      this.data = await this.specification.read(this.url);
    }

    return this.data;
  }

  reference(relativeUrl) {
    return this.specification.requirementAt(relativeUrl, this.url);
  }

  item(name) {
    const data = this.data === undefined ? undefined : this.data[name];

    return new Requirement(this.specification, `${this.url}/${name}`, data);
  }
}
