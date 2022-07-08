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

    if (tail.length === 0) {
      return new Requirement(
        data[this.unescapeJsonPointer(head)],
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
      callback([key, this.select(this.escapeJsonPointer(key))]);
    });
  }

  map(callback) {
    const result = [];

    // eslint-disable-next-line array-callback-return
    this.forEach((entry) => result.push(callback(entry)));

    return result;
  }

  escapeJsonPointer(string) {
    return string.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  unescapeJsonPointer(pointer) {
    return pointer.replaceAll("~1", "/").replaceAll("~0", "~");
  }

  *[Symbol.iterator]() {
    if (!this.data) {
      return;
    }

    for (const key of Object.keys(this.data)) {
      yield [key, this.select(key)];
    }
  }
}
