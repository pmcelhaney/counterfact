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

  writeToScript(script) {
    if (this.requirement.isReference) {
      // hmm, I think the idea of references in YAML and exports need to be decoupled
      // write(script) writes inline code and may call script.import(this, scriptPath)
      // dereference() is asynchronous and returns a new coder
      // if a coder wants to be in a specific file, it can check to see which file
      // it's in and either call file.import() or write the code directly

      return script.import(this);
    }

    return `/* ${this.id} */`;
  }

  async writeReferenceToScript(script) {
    const delegateCoder = await this.coderForReferencedRequirement();

    delegateCoder.writeToScript(script);
  }

  async coderForReferencedRequirement() {
    const requirement = await this.requirement.reference();

    return new this(requirement);
  }

  async implement(script) {
    const data = await this.requirement.read();

    return this.write(data, script);
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
