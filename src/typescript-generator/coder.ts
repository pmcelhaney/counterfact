export class Coder {
  public constructor(requirement) {
    this.requirement = requirement;
  }

  public get id() {
    if (this.requirement.isReference) {
      return `${this.constructor.name}@${this.requirement.$ref}`;
    }

    return `${this.constructor.name}@${this.requirement.url}`;
  }

  public beforeExport() {
    return "";
  }

  public write() {
    // This method should be overridden by a subclass.

    return `/* ${this.id} */`;
  }

  public *names(rawName = this.requirement.url.split("/").at(-1)) {
    const name = rawName
      .replace(/^\d/u, (digit) => `_${digit}`)
      .replace(/[^\w$]/gu, "_");

    yield name;

    let index = 1;

    const MAX_NAMES_TO_GENERATE_BEFORE_GIVING_UP = 100;

    while (index < MAX_NAMES_TO_GENERATE_BEFORE_GIVING_UP) {
      index += 1;
      yield name + index;
    }
  }

  public typeDeclaration() {
    return "";
  }

  public modulePath() {
    return "did-not-override-coder-modulePath.ts";
  }

  public async delegate() {
    if (!this.requirement.isReference) {
      return this;
    }

    const requirement = await this.requirement.reference();

    return new this.constructor(requirement);
  }
}
