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
        exportStatement.code = `export const ${name} = ${availableCoder.write(
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

  import(coder, path) {
    const cacheKey = `${coder.id}@${path}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const name = coder.name(this.imports);

    const scriptFromWhichToExport = this.repository.get(path);

    const exportedName = scriptFromWhichToExport.export(coder);

    this.imports.set(name, {
      script: scriptFromWhichToExport,
      name: exportedName,
    });

    this.cache.set(cacheKey, name);

    return name;
  }

  isInProgress() {
    return Array.from(this.exports.values()).some(
      (exportStatement) => !exportStatement.done
    );
  }

  finished() {
    return Promise.all(
      Array.from(this.exports.values(), (value) => value.promise)
    );
  }

  importStatements() {
    return Array.from(
      this.imports,
      ([name, { script, name: exportedName }]) =>
        `import ${name} from "./${script.path}";`
    );
  }

  exportStatements() {
    return Array.from(this.exports.values(), (value) => value.code);
  }

  contents() {
    return `${this.importStatements().join(
      "\n"
    )}\n\n${this.exportStatements().join("\n")}\n`;
  }
}
