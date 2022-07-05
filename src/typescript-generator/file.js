import { Line } from "./line.js";

export class File {
  constructor() {
    this.exports = new Map();
  }

  addExport(namer, url, printer) {
    const name = namer(this.exports);

    this.exports.set(name, new Line(url, printer));

    return name;
  }
}
