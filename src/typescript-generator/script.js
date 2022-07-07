export class Script {
  constructor(repository, path) {
    this.repository = repository;
    this.exports = new Map();
    this.imports = new Map();
    this.cache = new Map();
    this.path = path;
  }

  export(coder) {
    const name = coder.name(this.exports);

    const exportStatement = {
      id: coder.id,
      done: false,
    };

    exportStatement.promise = coder
      .delegate()
      // eslint-disable-next-line promise/prefer-await-to-then
      .then((availableCoder) => {
        exportStatement.code = `export ${name} = ${availableCoder.write(
          this
        )};`;

        return availableCoder;
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .catch((error) => {
        exportStatement.code = `/* error creating export "${name}": ${error} */`;
        exportStatement.error = error;
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .finally(() => {
        exportStatement.done = true;
      });

    this.exports.set(name, exportStatement);

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

  isInProgress() {
    return this.exports
      .values()
      .some((exportStatement) => !exportStatement.done);
  }

  finished() {
    return Promise.all(this.exports.values().map((value) => value.promise));
  }

  importStatements() {
    return Array.from(
      this.imports,
      ([name, { script, name: exportedName }]) =>
        `import ${name} from "./${script.path}";`
    );
  }
}
