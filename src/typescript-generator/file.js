import { Statement } from "./statement.js";

export class File {
  constructor(generator) {
    this.generator = generator;
    this.exports = new Map();
    this.imports = new Map();
  }

  addExport(url, printer, namer) {
    const name = namer(url, this.exports);

    const source = this.generator.getSource(url);

    this.exports.set(name, new Statement(source, url, printer));

    return name;
  }

  addExport2(coder) {
    const name = coder.name(this.exports);

    this.exports.set(name, coder);

    return name;
  }

  import(coder) {
    const name = coder.name(this.imports);

    this.imports.set(name, coder.filePath);

    return name;
  }
}
