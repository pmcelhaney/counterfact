export class Generator {
  constructor() {
    this.files = new Map();
  }

  // eslint-disable-next-line max-params
  export(filename, namer, url, printer) {
    if (!this.files.has(filename)) {
      this.files.set(filename, { exports: new Map() });
    }

    const file = this.files.get(filename);

    const name = namer(file.exports);

    file.exports.set(namer(file.exports), {
      print() {
        return printer();
      },
    });

    return name;
  }
}
