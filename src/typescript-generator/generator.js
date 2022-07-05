import { File } from "./file.js";

export class Generator {
  constructor() {
    this.files = new Map();
  }

  // eslint-disable-next-line max-params
  export(filename, namer, url, printer) {
    if (!this.files.has(filename)) {
      this.files.set(filename, new File());
    }

    const file = this.files.get(filename);

    return file.addExport(namer, url, printer);
  }
}
