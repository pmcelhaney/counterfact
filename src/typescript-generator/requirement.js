export class Requirement {
  constructor(data, url = "", specification = undefined) {
    this.data = data;
    this.url = url;
    this.specification = specification;
  }

  get isReference() {
    return this.data.$ref !== undefined;
  }

  reference() {
    return this.specification.requirementAt(this.data.$ref, this.url);
  }

  item(path, data = this.data, basePath = "") {
    const [head, ...tail] = path.split("/");

    if (tail.length === 0) {
      return new Requirement(
        data[head],
        `${this.url}/${basePath}${head}`,
        this.specification
      );
    }

    return this.item(tail.join("/"), data[head], `${basePath}${head}/`);
  }

  toJSON() {
    return {
      specification: this.specification,
      url: this.url,
      data: this.data,
    };
  }
}
