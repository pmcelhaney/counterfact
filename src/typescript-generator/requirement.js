export class Requirement {
  constructor(specification, url, data) {
    this.specification = specification;
    this.url = url;
    this.data = data;
  }

  reference() {
    return this.specification.requirementAt(this.data.$ref, this.url);
  }

  item(path, data = this.data, basePath = "") {
    const [head, ...tail] = path.split("/");

    if (tail.length === 0) {
      return new Requirement(
        this.specification,
        `${this.url}/${basePath}${head}`,
        data[head]
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
