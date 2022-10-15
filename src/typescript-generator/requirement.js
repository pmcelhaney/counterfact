export class Requirement {
  constructor(data, url = "", specification = undefined) {
    if (data === undefined) {
      throw new Error("cannot create requirement without data");
    }

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

  has(item) {
    return item in this.data;
  }

  get(item) {
    if (!this.has(item)) {
      return undefined;
    }

    return new Requirement(
      this.data[item],
      `${this.url}/${item}`,
      this.specification
    );
  }

  select(path, data = this.data, basePath = "") {
    const [head, ...tail] = path.split("/");

    const branch = data[this.unescapeJsonPointer(head)];

    if (!branch) {
      return undefined;
    }

    if (tail.length === 0) {
      return new Requirement(
        branch,
        `${this.url}/${basePath}${head}`,
        this.specification
      );
    }

    return this.select(tail.join("/"), branch, `${basePath}${head}/`);
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
      callback([key, this.select(this.escapeJsonPointer(key))]);
    });
  }

  map(callback) {
    const result = [];

    // eslint-disable-next-line array-callback-return
    this.forEach(([key, value]) => result.push(callback(value, key)));

    return result;
  }

  flatMap(callback) {
    const result = [];

    // eslint-disable-next-line array-callback-return
    this.forEach(([key, value]) => result.push(callback(value, key)));

    return result.flat();
  }

  escapeJsonPointer(string) {
    return string.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  unescapeJsonPointer(pointer) {
    return pointer.replaceAll("~1", "/").replaceAll("~0", "~");
  }
}
