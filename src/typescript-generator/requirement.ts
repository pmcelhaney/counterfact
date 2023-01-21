export class Requirement {
  public constructor(data, url = "", specification = undefined) {
    this.data = data;
    this.url = url;
    this.specification = specification;
  }

  get isReference() {
    return this.data?.$ref !== undefined;
  }

  public reference() {
    return this.specification.requirementAt(this.data.$ref, this.url);
  }

  public has(item) {
    return item in this.data;
  }

  public get(item) {
    if (!this.has(item)) {
      return undefined;
    }

    return new Requirement(
      this.data[item],
      `${this.url}/${item}`,
      this.specification
    );
  }

  public select(path, data = this.data, basePath = "") {
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

  public forEach(callback) {
    Object.keys(this.data).forEach((key) => {
      callback(this.select(this.escapeJsonPointer(key)), key);
    });
  }

  public map(callback) {
    const result = [];

    // eslint-disable-next-line array-callback-return
    this.forEach((value, key) => result.push(callback(value, key)));

    return result;
  }

  public flatMap(callback) {
    // eslint-disable-next-line unicorn/prefer-array-flat-map
    return this.map(callback).flat();
  }

  public find(callback) {
    let result;

    this.forEach((value, key) => {
      // eslint-disable-next-line node/callback-return
      if (result === undefined && callback(value, key)) {
        result = value;
      }
    });

    return result;
  }

  public escapeJsonPointer(string) {
    return string.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  public unescapeJsonPointer(pointer) {
    return pointer.replaceAll("~1", "/").replaceAll("~0", "~");
  }
}
