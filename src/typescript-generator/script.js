import nodePath from "node:path";

export class Script {
  constructor(repository, path) {
    this.repository = repository;
    this.exports = new Map();
    this.imports = new Map();
    this.externalImports = new Map();
    this.cache = new Map();
    this.typeCache = new Map();
    this.path = path;
  }

  firstUniqueName(coder) {
    for (const name of coder.names()) {
      if (!this.imports.has(name) && !this.exports.has(name)) {
        return name;
      }
    }

    throw new Error(`could not find a unique name for ${coder.id}`);
  }

  export(coder, isType = false, isDefault = false) {
    const cacheKey = isDefault
      ? "default"
      : `${coder.id}@${nodePath}:${isType}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const name = this.firstUniqueName(coder);

    this.cache.set(cacheKey, name);

    const exportStatement = {
      id: coder.id,
      done: false,
      isType,
      isDefault,
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
        exportStatement.code = `{/* error creating export "${name}" for ${this.path}: ${error.stack} */}`;
        exportStatement.error = error;
      })
      // eslint-disable-next-line promise/prefer-await-to-then
      .finally(() => {
        exportStatement.done = true;
      });

    this.exports.set(name, exportStatement);

    return name;
  }

  exportDefault(coder, isType = false) {
    this.export(coder, isType, true);
  }

  import(coder, isType = false, isDefault = false) {
    const modulePath = coder.modulePath();

    const cacheKey = `${coder.id}@${modulePath}:${isType}:${isDefault}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const name = this.firstUniqueName(coder);

    this.cache.set(cacheKey, name);

    const scriptFromWhichToExport = this.repository.get(modulePath);

    const exportedName = scriptFromWhichToExport.export(
      coder,
      isType,
      isDefault
    );

    this.imports.set(name, {
      script: scriptFromWhichToExport,
      name: exportedName,
      isType,
      isDefault,
    });

    return name;
  }

  importType(coder) {
    return this.import(coder, true);
  }

  importDefault(coder, isType = false) {
    return this.import(coder, isType, true);
  }

  importExternal(name, modulePath, isType = false) {
    this.externalImports.set(name, { modulePath, isType });

    return name;
  }

  importExternalType(name, modulePath) {
    return this.importExternal(name, modulePath, true);
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

  externalImportsStatements() {
    return Array.from(
      this.externalImports,
      ([name, { modulePath, isType, isDefault }]) =>
        `import${isType ? " type" : ""} ${
          isDefault ? name : `{ ${name} }`
        } from "${modulePath}";`
    );
  }

  importStatements() {
    return Array.from(
      this.imports,
      ([name, { script, isType, isDefault }]) =>
        `import${isType ? " type" : ""} ${
          isDefault ? name : `{ ${name} }`
        } from "./${nodePath.relative(
          nodePath.dirname(this.path),
          script.path.replace(/\.ts$/u, ".js")
        )}";`
    );
  }

  exportStatements() {
    return Array.from(
      this.exports.values(),
      ({ name, isType, isDefault, code, typeDeclaration }) => {
        if (code.raw) {
          return code.raw;
        }

        if (isDefault) {
          return `export default ${code};`;
        }

        const keyword = isType ? "type" : "const";
        const typeAnnotation =
          typeDeclaration.length === 0 ? "" : `:${typeDeclaration}`;

        return `export ${keyword} ${name}${typeAnnotation} = ${code};`;
      }
    );
  }

  contents() {
    return [
      ...this.externalImportsStatements(),
      ...this.importStatements(),
      ...this.exportStatements(),
    ].join("\n");
  }
}
