export class Coder {
  constructor(spec) {
    this.spec = spec;
  }

  write(script, requirement) {
    return "";
  }

  async implement(script, url) {
    // read the requirement from the spec
    const requirement = await this.spec.readRequirement(url);

    return this.write(script, requirement);
  }

  name(url, namespace) {
    const name = url.split("/").at(-1);

    let candidate = name;

    let index = 1;

    while (namespace.has(candidate)) {
      index += 1;
      candidate = name + index;
    }

    return candidate;
  }
}
