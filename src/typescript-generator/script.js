import path from "node:path";

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

  export(coder, isType = false) {
    const cacheKey = `${coder.id}@${path}:${isType}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const name = this.firstUniqueName(coder);

    this.cache.set(cacheKey, name);

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

  import(coder, isType = false) {
    const path = coder.modulePath();

    const cacheKey = `${coder.id}@${path}:${isType}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const name = this.firstUniqueName(coder);

    this.cache.set(cacheKey, name);

    if (name.startsWith("ApiResponse")) {
      console.log(cacheKey);
    }

    if (name === "get") {
      throw new Error(`name not working, ${coder.names().next().value}`);
    }

    const scriptFromWhichToExport = this.repository.get(path);

    const exportedName = scriptFromWhichToExport.export(coder, isType);

    this.imports.set(name, {
      script: scriptFromWhichToExport,
      name: exportedName,
      isType,
    });

    return name;
  }

  importType(coder) {
    return this.import(coder, true);
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
      ([name, { modulePath, isType }]) =>
        `import${isType ? " type" : ""} { ${name} } from "${modulePath}";`
    );
  }

  importStatements() {
    return Array.from(
      this.imports,
      ([name, { script, isType, name: exportedName }]) =>
        `import${isType ? " type" : ""} { ${name} } from "./${path.relative(
          path.dirname(this.path),
          script.path.replace(/\.ts$/u, ".js")
        )}";`
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
    return [
      ...this.externalImportsStatements(),
      ...this.importStatements(),
      ...this.exportStatements(),
    ].join("\n");
  }
}
