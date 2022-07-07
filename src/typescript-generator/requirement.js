export class Requirement {
  constructor(specification, url, data) {
    this.specification = specification;
    this.url = url;
    this.data = data;
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
