import type { Specification } from "./specification.js";

export type RequirementData = Record<string, unknown> & {
  $ref?: string;
};

export class Requirement {
  public data: RequirementData;
  public url: string;
  public specification: Specification | undefined;

  public constructor(
    data: RequirementData,
    url = "",
    specification: Specification | undefined = undefined,
  ) {
    this.data = data;
    this.url = url;
    this.specification = specification;
  }

  public get isReference(): boolean {
    return this.data["$ref"] !== undefined;
  }

  public reference(): Requirement {
    return this.specification!.getRequirement(this.data["$ref"] as string);
  }

  public has(item: string): boolean {
    if (this.isReference) {
      return this.reference().has(item);
    }

    return item in this.data;
  }

  public get(item: string | number): Requirement | undefined {
    if (this.isReference) {
      return this.reference().get(item);
    }

    const key = String(item);

    if (!this.has(key)) {
      return undefined;
    }

    return new Requirement(
      this.data[key] as RequirementData,
      `${this.url}/${this.escapeJsonPointer(key)}`,
      this.specification,
    );
  }

  public select(path: string): Requirement | undefined {
    const parts = path
      .split("/")
      .map((p) => this.unescapeJsonPointer(p) as string)
      // Unescape URL encoded characters (e.g. %20 -> " ")
      // Technically we should not be unescaping, but it came up in https://github.com/pmcelhaney/counterfact/issues/1083
      // and I can't think of a reason anyone would intentionally put a % in a key name.

      .map(unescape);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let result: Requirement | undefined = this;

    for (const part of parts) {
      result = result.get(part);

      if (result === undefined) {
        return undefined;
      }
    }

    return result;
  }

  public forEach(callback: (value: Requirement, key: string) => void): void {
    Object.keys(this.data).forEach((key) => {
      callback(this.select(this.escapeJsonPointer(key) as string)!, key);
    });
  }

  public map<T>(callback: (value: Requirement, key: string) => T): T[] {
    const result: T[] = [];

    this.forEach((value, key) => result.push(callback(value, key)));

    return result;
  }

  public flatMap<T>(
    callback: (value: Requirement, key: string) => T | T[],
  ): T[] {
    return this.map(callback).flat() as T[];
  }

  public find(
    callback: (value: Requirement, key: string) => boolean,
  ): Requirement | undefined {
    let result: Requirement | undefined;

    this.forEach((value, key) => {
      if (result === undefined && callback(value, key)) {
        result = value;
      }
    });

    return result;
  }

  public escapeJsonPointer(value: string | number): string | number {
    if (typeof value !== "string") return value;
    return value.replaceAll("~", "~0").replaceAll("/", "~1");
  }

  public unescapeJsonPointer(pointer: string | number): string | number {
    if (typeof pointer !== "string") return pointer;
    return pointer.replaceAll("~1", "/").replaceAll("~0", "~");
  }
}
