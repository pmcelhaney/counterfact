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
    return item in this.data;
  }

  get(item) {
    if (!this.has(item)) {
      return undefined;
    }

    return new Requirement(
      this.data[item],
      `${this.url}/${item}`,
      this.specification,
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
        this.specification,
      );
    }

    return this.select(tail.join("/"), branch, `${basePath}${head}/`);
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
