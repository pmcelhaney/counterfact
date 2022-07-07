export class Script {
  constructor(repository) {
    this.repository = repository;
    this.exports = new Map();
    this.imports = new Map();
    this.cache = new Map();
  }

  export(coder) {
    const name = coder.name(this.exports);

    this.exports.set(name, {
      id: coder.id,

      code: coder
        .delegate()
        // eslint-disable-next-line promise/prefer-await-to-then
        .then(
          (availableCoder) => `export ${name} = ${availableCoder.write(this)};`
        ),
    });

    return name;
  }

  import(coder) {
    if (this.cache.has(coder.id)) {
      return this.cache.get(coder.id);
    }

    const name = coder.name(this.imports);

    const scriptFromWhichToExport = this.repository.get(coder.scriptPath);

    const exportedName = scriptFromWhichToExport.export(coder);

    this.imports.set(name, {
      script: scriptFromWhichToExport,
      name: exportedName,
    });

    this.cache.set(coder.id, name);

    return name;
  }
}
