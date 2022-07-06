export class Coder {
  constructor(spec, url) {
    this.spec = spec;
    this.url = url;
  }

  write() {
    return "";
  }

  name(namespace) {
    const name = this.url.split("/").at(-1);

    let candidate = name;

    let index = 1;

    while (namespace.has(candidate)) {
      index += 1;
      candidate = name + index;
    }

    return candidate;
  }
}
