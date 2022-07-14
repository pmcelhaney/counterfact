export class Coder {
  constructor(requirement) {
    this.requirement = requirement;
  }

  get id() {
    if (this.requirement.isReference) {
      return `${this.constructor.name}@${this.requirement.$ref}`;
    }

    return `${this.constructor.name}@${this.requirement.url}`;
  }

  write(script) {
    // This method should be overridden by a subclass.

    return `/* ${this.id} */`;
  }

  async delegate() {
    if (!this.requirement.isReference) {
      return this;
    }

    const requirement = await this.requirement.reference();

    return new this.constructor(requirement);
  }

  *names(name = this.requirement.url.split("/").at(-1)) {
    yield name;

    let index = 1;

    while (true) {
      index += 1;
      yield name + index;
    }
  }

  typeDeclaration() {
    return "";
  }

  modulePath() {
    return "did-not-override-coder-modulePath.ts";
  }
}
