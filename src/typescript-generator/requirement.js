export class Requirement {
  constructor(data, url = "", specification = undefined) {
    this.data = data;
    this.url = url;
    this.specification = specification;
  }

  get isReference() {
    return this.data?.$ref !== undefined;
  }

  reference() {
    return this.specification.requirementAt(this.data.$ref, this.url);
  }

  select(path, data = this.data, basePath = "") {
    const [head, ...tail] = path.split("/");

    const unescapedHead = head.replaceAll("~1", "/").replaceAll("~0", "~");

    if (tail.length === 0) {
      return new Requirement(
        data[unescapedHead],
        `${this.url}/${basePath}${head}`,
        this.specification
      );
    }

    return this.select(tail.join("/"), data[head], `${basePath}${head}/`);
  }

  toJSON() {
    return {
      specification: this.specification,
      url: this.url,
      data: this.data,
    };
  }

  forEach(callback) {
    Object.keys(this.data).forEach((key) => {
      callback([
        key,
        this.select(key.replaceAll("~", "~0").replaceAll("/", "~1")),
      ]);
    });
  }
}
