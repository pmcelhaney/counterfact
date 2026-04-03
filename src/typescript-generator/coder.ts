import type { Requirement } from "./requirement.js";
import type { Script } from "./script.js";

export class Coder {
  public requirement: Requirement;

  public constructor(requirement: Requirement) {
    this.requirement = requirement;
  }

  public get id(): string {
    if (this.requirement.isReference) {
      return `${this.constructor.name}@${this.requirement.data["$ref"] as string}`;
    }

    return `${this.constructor.name}@${this.requirement.url}`;
  }

  public beforeExport(_path?: string): string {
    return "";
  }

  public write(script: Script): string {
    if (this.requirement.isReference) {
      return script.import(this);
    }

    return this.writeCode(script);
  }

  public writeCode(_script: Script): string {
    throw new Error(
      "write() is abstract and should be overwritten by a subclass",
    );
  }

  public async delegate(): Promise<Coder> {
    if (!this.requirement.isReference) {
      return this;
    }

    const requirement = await this.requirement.reference();

    return new (this.constructor as new (req: Requirement) => Coder)(
      requirement,
    );
  }

  public *names(
    rawName = this.requirement.url.split("/").at(-1)!,
  ): Generator<string> {
    const name = rawName
      .replace(/^\d/u, (digit) => `_${digit}`)
      .replaceAll(/[^\w$]/gu, "_");

    yield name;

    let index = 1;

    const MAX_NAMES_TO_GENERATE_BEFORE_GIVING_UP = 100;

    while (index < MAX_NAMES_TO_GENERATE_BEFORE_GIVING_UP) {
      index += 1;
      yield name + index;
    }
  }

  public typeDeclaration(
    _namespace?: Map<string, ExportStatement>,
    _script?: Script,
  ): string {
    return "";
  }

  public modulePath(): string {
    return "did-not-override-coder-modulePath.ts";
  }
}

export interface ExportStatement {
  beforeExport: string;
  done: boolean;
  id: string;
  isDefault: boolean;
  isType: boolean;
  typeDeclaration: string;
  name?: string;
  code?: string | { raw: string };
  error?: Error;
  promise?: Promise<Coder | undefined>;
}
