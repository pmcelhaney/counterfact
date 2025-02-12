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
    return this.specification.getRequirement(this.data.$ref);
  }

  has(item) {
    if (this.isReference) {
      return this.reference().has(item);
    }

    return item in this.data;
  }

  get(item) {
    if (this.isReference) {
      return this.reference().get(item);
    }

    if (!this.has(item)) {
      return undefined;
    }

    return new Requirement(
      this.data[item],
      `${this.url}/${this.escapeJsonPointer(item)}`,
      this.specification,
    );
  }

  select(path, data = this.data, basePath = "") {
    const parts = path
      .split("/")
      .map(this.unescapeJsonPointer)
      // Unescape URL encoded characters (e.g. %20 -> " ")
      // Technically we should not be unescaping, but it came up in https://github.com/pmcelhaney/counterfact/issues/1083
      // and I can't think of a reason anyone would intentionally put a % in a key name.
      .map(unescape);

    let result = this;

    for (const part of parts) {
      result = result.get(part);

      if (result === undefined) {
        return undefined;
      }
    }

    return result;
  }

  forEach(callback) {
    Object.keys(this.data).forEach((key) => {
      callback(this.select(this.escapeJsonPointer(key)), key);
    });
  }

  map(callback) {
    const result = [];

    this.forEach((value, key) => result.push(callback(value, key)));

    return result;
  }

  flatMap(callback) {
    return this.map(callback).flat();
  }

  find(callback) {
    let result;

    this.forEach((value, key) => {
      if (result === undefined && callback(value, key)) {
        result = value;
      }
    });

    return result;
  }

  escapeJsonPointer(value) {
    if (typeof value !== "string") return value;
    return value.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  unescapeJsonPointer(pointer) {
    if (typeof pointer !== "string") return pointer;
    return pointer.replaceAll("~1", "/").replaceAll("~0", "~");
  }
}
