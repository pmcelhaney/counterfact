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

  get(item, escape = false) {
    if (this.isReference) {
      return this.reference().get(item, escape);
    }

    if (!this.has(item)) {
      return undefined;
    }

    return new Requirement(
      this.data[item],
      escape
        ? `${this.url}/${this.escapeJsonPointer(item)}`
        : `${this.url}/${item}`,
      this.specification,
    );
  }

  select(path, data = this.data, basePath = "") {
    const parts = path.split("/").map(this.unescapeJsonPointer);

    let result = this;

    for (const part of parts) {
      result = result.get(part, true);

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

  escapeJsonPointer(string) {
    return string.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  unescapeJsonPointer(pointer) {
    return pointer.replaceAll("~1", "/").replaceAll("~0", "~");
  }
}
