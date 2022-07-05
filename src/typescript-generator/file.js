import { Line } from "./line.js";

export class File {
  constructor(generator) {
    this.generator = generator;
    this.exports = new Map();
  }

  addExport(url, printer, namer) {
    const name = namer(url, this.exports);

    const source = this.generator.getSource(url);

    this.exports.set(name, new Line(source, url, printer));

    return name;
  }
}
