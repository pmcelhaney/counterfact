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

  write(data, script) {
    return "";
  }

  async implement(script) {
    const data = await this.requirement.read();

    return this.write(script, data);
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
