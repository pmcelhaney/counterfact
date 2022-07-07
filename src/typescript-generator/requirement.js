export class Requirement {
  constructor(specification, url, data) {
    this.specification = specification;
    this.url = url;
    this.data = data;
  }

  // isLoaded can go away
  // a requirement will be loaded at construction time
  // if the requirement is a reference, this.reference() returns a promise with the referenced requirement

  get isLoaded() {
    return this.data !== undefined;
  }

  async read() {
    if (!this.isLoaded) {
      this.data = await this.specification.read(this.url);
    }

    return this.data;
  }

  reference() {
    return this.specification.requirementAt(this.data.$ref, this.url);
  }

  item(name) {
    return new Requirement(
      this.specification,
      `${this.url}/${name}`,
      this.data[name]
    );
  }
}
