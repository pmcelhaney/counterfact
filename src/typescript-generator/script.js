export class Script {
  constructor(repository, path) {
    this.repository = repository;
    this.exports = new Map();
    this.imports = new Map();
    this.cache = new Map();
    this.typeCache = new Map();
    this.path = path;
  }

  export(coder, isType = false) {
    const name = coder.name(this.exports);

    const exportStatement = {
      id: coder.id,
      done: false,
      isType,
      typeDeclaration: coder.typeDeclaration(this.exports, this),
    };

    exportStatement.promise = coder
      .delegate()
      // eslint-disable-next-line promise/prefer-await-to-then
      .then((availableCoder) => {
        exportStatement.name = name;
        exportStatement.code = availableCoder.write(this);

        return availableCoder;
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .catch((error) => {
        exportStatement.code = `/* error creating export "${name}" for ${this.path}: ${error.stack} */`;
        exportStatement.error = error;
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .finally(() => {
        exportStatement.done = true;
      });

    this.exports.set(name, exportStatement);

    return name;
  }

  import(coder, path, isType = false) {
    const cacheKey = `${coder.id}@${path}:${isType}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const name = coder.name(this.imports);

    const scriptFromWhichToExport = this.repository.get(path);

    const exportedName = scriptFromWhichToExport.export(coder, isType);

    this.imports.set(name, {
      script: scriptFromWhichToExport,
      name: exportedName,
      isType,
    });

    this.cache.set(cacheKey, name);

    return name;
  }

  importType(coder, path) {
    return this.import(coder, path, true);
  }

  exportType(coder) {
    return this.export(coder, true);
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
      ([name, { script, isType, name: exportedName }]) =>
        `import${isType ? " type" : ""} ${name} from "./${script.path}";`
    );
  }

  exportStatements() {
    return Array.from(
      this.exports.values(),
      ({ name, isType, code, typeDeclaration }) => {
        const keyword = isType ? "type" : "const";
        const typeAnnotation =
          typeDeclaration.length === 0 ? "" : `:${typeDeclaration}`;

        return `export ${keyword} ${name}${typeAnnotation} = ${code};`;
      }
    );
  }

  contents() {
    return `${this.importStatements().join(
      "\n"
    )}\n\n${this.exportStatements().join("\n")}\n`;
  }
}
