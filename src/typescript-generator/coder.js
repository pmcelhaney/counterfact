export class Coder {
  constructor(requirement) {
    this.requirement = requirement;
  }

  get id() {
    return `${this.constructor.name}@${this.requirement.url}`;
  }

  get scriptPath() {
    return "";
  }

  write(script) {
    // This method should be overridden by a subclass.
    // The implementation below is a placeholder.

    if (this.requirement.isReference) {
      return script.import(
        this,
        this.requirement.sourceFilePath.replace(".yaml", ".ts")
      );
    }

    return `/* ${this.id} */`;
  }

  async delegate() {
    if (!this.requirement.isReference) {
      return this;
    }

    const requirement = await this.requirement.reference();

    return new this.constructor(requirement);
  }

  name(namespace) {
    const name = this.requirement.url.split("/").at(-1);

    let candidate = name;

    let index = 1;

    while (namespace.has(candidate)) {
      index += 1;
      candidate = name + index;
    }

    return candidate;
  }
}
