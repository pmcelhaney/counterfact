export class Script {
  constructor(repository) {
    this.repository = repository;
    this.exports = new Map();
    this.imports = new Map();
  }

  export(coder) {
    const name = coder.name(this.exports);

    // this.exports.set(name, {
    //   id: coder.id,
    //
    //   code: (await coder.dereference()).write(this),
    // });

    this.exports.set(name, coder);

    return name;
  }

  import(coder) {
    const name = coder.name(this.imports);

    const scriptFromWhichToExport = this.repository.get(coder.scriptPath);

    const exportedName = scriptFromWhichToExport.export(coder);

    this.imports.set(name, {
      script: scriptFromWhichToExport,
      name: exportedName,
    });

    return name;
  }
}
