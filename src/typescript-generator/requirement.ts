import type { Specification } from "./specification";

export interface RequirementData {
  $ref?: string;
  [key: string]: unknown;
}

export class Requirement {
  private readonly data: RequirementData;

  public readonly url: string;

  private readonly specification: Specification | undefined;

  public constructor(
    data: RequirementData,
    url = "",
    specification: Specification | undefined = undefined
  ) {
    this.data = data;
    this.url = url;
    this.specification = specification;
  }

  public get isReference(): boolean {
    return this.data.$ref !== undefined;
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

  public select(
    path: string,
    data = this.data,
    basePath = ""
  ): Requirement | undefined {
    const [head, ...tail] = path.split("/");

    const branch: RequirementData | null | undefined =
      data[this.unescapeJsonPointer(head)];

    if (branch === undefined || branch === null) {
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
    let result: unknown;

    this.forEach((value, key) => {
      // eslint-disable-next-line node/callback-return
      if (result === undefined && callback(value, key)) {
        result = value;
      }
    });

    return result;
  }

  public escapeJsonPointer(string: string): string {
    return string.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  public unescapeJsonPointer(pointer: string): string {
    return pointer.replaceAll("~1", "/").replaceAll("~0", "~");
  }

  public async reference(): Promise<Requirement> {
    return await this.specification.requirementAt(this.data.$ref, this.url);
  }
}
