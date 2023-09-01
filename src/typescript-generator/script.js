import nodePath from "node:path";

import prettier from "prettier";

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
      beforeExport: coder.beforeExport(this.path),
      done: false,
      id: coder.id,
      isDefault,
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
      isDefault,
    );

    this.imports.set(name, {
      isDefault,
      isType,
      name: exportedName,
      script: scriptFromWhichToExport,
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
    this.externalImports.set(name, { isType, modulePath });

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
      (exportStatement) => !exportStatement.done,
    );
  }

  finished() {
    return Promise.all(
      Array.from(this.exports.values(), (value) => value.promise),
    );
  }

  externalImportsStatements() {
    return Array.from(
      this.externalImports,
      ([name, { isDefault, isType, modulePath }]) =>
        `import${isType ? " type" : ""} ${
          isDefault ? name : `{ ${name} }`
        } from "${modulePath}";`,
    );
  }

  importStatements() {
    return Array.from(
      this.imports,
      ([name, { isDefault, isType, script }]) =>
        `import${isType ? " type" : ""} ${
          isDefault ? name : `{ ${name} }`
        } from "./${nodePath.relative(
          nodePath.dirname(this.path),
          script.path.replace(/\.ts$/u, ".js"),
        )}";`,
    );
  }

  exportStatements() {
    return Array.from(
      this.exports.values(),
      ({ beforeExport, code, isDefault, isType, name, typeDeclaration }) => {
        if (code.raw) {
          return code.raw;
        }

        if (isDefault) {
          return `${beforeExport}export default ${code};`;
        }

        const keyword = isType ? "type" : "const";
        const typeAnnotation =
          typeDeclaration.length === 0 ? "" : `:${typeDeclaration}`;

        return `${beforeExport}export ${keyword} ${name}${typeAnnotation} = ${code};`;
      },
    );
  }

  contents() {
    return prettier.format(
      [
        this.externalImportsStatements().join("\n"),
        this.importStatements().join("\n"),
        "\n\n",
        this.exportStatements().join("\n\n"),
      ].join(""),
      { parser: "typescript" },
    );
  }
}
