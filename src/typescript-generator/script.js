export class Script {
  constructor(generator) {
    this.generator = generator;
    this.exports = new Map();
    this.imports = new Map();
  }

  export(coder) {
    const name = coder.name(this.exports);

    this.exports.set(name, coder);

    return name;
  }

  import(coder) {
    const name = coder.name(this.imports);

    this.imports.set(name, { path: coder.filePath });

    return name;
  }
}
