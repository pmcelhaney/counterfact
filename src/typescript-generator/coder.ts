import type { Requirement } from "./requirement";
import type { Script } from "./script";

export abstract class Coder {
  private readonly requirement: Requirement;

  public constructor(requirement: Requirement) {
    this.requirement = requirement;
  }

  public get id() {
    if (this.requirement.isReference) {
      return String(this.constructor.name);
    }

    return `${this.constructor.name}@${this.requirement.url}`;
  }

  public beforeExport() {
    return "";
  }

  public abstract write(script: Script);

  public *names(
    rawName = this.requirement.url.split("/").at(-1) ??
      "THIS_SHOULD_BE_IMPOSSIBLE"
  ) {
    const name = rawName
      .replace(/^\d/u, (digit) => `_${digit}`)
      .replace(/[^\w$]/gu, "_");

    yield name;

    let index = 1;

    const MAX_NAMES_TO_GENERATE_BEFORE_GIVING_UP = 100;

    while (index < MAX_NAMES_TO_GENERATE_BEFORE_GIVING_UP) {
      index += 1;
      yield name + String(index);
    }
  }

  public typeDeclaration(script: Script): string {
    void script;
    return "";
  }

  public modulePath() {
    return "did-not-override-coder-modulePath.ts";
  }

  public async delegate(): Promise<Coder> {
    if (!this.requirement.isReference) {
      return this;
    }

    const requirement = await this.requirement.reference();

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return new this.constructor(requirement) as Coder;
  }
}
