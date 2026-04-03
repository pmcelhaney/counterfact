import nodePath from "node:path";

import createDebugger from "debug";
import { format } from "prettier";

import { escapePathForWindows } from "../util/windows-escape.js";
import type { Coder, ExportStatement } from "./coder.js";
import type { Repository } from "./repository.js";

const debug = createDebugger("counterfact:typescript-generator:script");

interface ImportEntry {
  isDefault: boolean;
  isType: boolean;
  name: string;
  script: Script;
}

interface ExternalImportEntry {
  isDefault?: boolean;
  isType: boolean;
  modulePath: string;
}

export class Script {
  public repository: Repository;
  public comments: string[];
  public exports: Map<string, ExportStatement>;
  public imports: Map<string, ImportEntry>;
  public externalImport: Map<string, ExternalImportEntry>;
  public cache: Map<string, string>;
  public typeCache: Map<string, string>;
  public path: string;

  public constructor(repository: Repository, path: string) {
    this.repository = repository;
    this.comments = [];
    this.exports = new Map();
    this.imports = new Map();
    this.externalImport = new Map();
    this.cache = new Map();
    this.typeCache = new Map();
    this.path = path;
  }

  public get relativePathToBase(): string {
    return this.path
      .split("/")
      .slice(0, -1)
      .map(() => "..")
      .join("/");
  }

  public firstUniqueName(coder: Coder): string {
    for (const name of coder.names()) {
      if (!this.imports.has(name)) {
        return name;
      }
    }

    throw new Error(`could not find a unique name for ${coder.id}`);
  }

  public export(coder: Coder, isType = false, isDefault = false): string {
    const cacheKey = isDefault ? "default" : `${coder.id}:${isType}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const name = this.firstUniqueName(coder);

    this.cache.set(cacheKey, name);

    const exportStatement: ExportStatement = {
      beforeExport: coder.beforeExport(this.path),
      done: false,
      id: coder.id,
      isDefault,
      isType,
      typeDeclaration: coder.typeDeclaration(this.exports, this),
    };

    exportStatement.promise = coder
      .delegate()

      .then((availableCoder) => {
        exportStatement.name = name;
        exportStatement.code = availableCoder.write(this);

        return availableCoder;
      })

      .catch((error: Error) => {
        exportStatement.code = `{/* error creating export "${name}" for ${this.path}: ${error.stack} */}`;
        exportStatement.error = error;
        return undefined;
      })

      .finally(() => {
        exportStatement.done = true;
      });

    this.exports.set(name, exportStatement);

    return name;
  }

  public exportDefault(coder: Coder, isType = false): void {
    this.export(coder, isType, true);
  }

  public import(coder: Coder, isType = false, isDefault = false): string {
    debug("import coder: %s", coder.id);

    const modulePath = coder.modulePath();

    const cacheKey = `${coder.id}@${modulePath}:${isType}:${isDefault}`;

    debug("cache key: %s", cacheKey);

    if (this.cache.has(cacheKey)) {
      debug("cache hit: %s", cacheKey);

      return this.cache.get(cacheKey)!;
    }

    debug("cache miss: %s", cacheKey);

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

  public importType(coder: Coder): string {
    return this.import(coder, true);
  }

  public importDefault(coder: Coder, isType = false): string {
    return this.import(coder, isType, true);
  }

  public importExternal(
    name: string,
    modulePath: string,
    isType = false,
  ): string {
    this.externalImport.set(name, { isType, modulePath });

    return name;
  }

  public importExternalType(name: string, modulePath: string): string {
    return this.importExternal(name, modulePath, true);
  }

  public importSharedType(name: string): string {
    return this.importExternal(
      name,
      nodePath
        .join(this.relativePathToBase, "counterfact-types/index.ts")
        .replaceAll("\\", "/"),
      true,
    );
  }

  public exportType(coder: Coder): string {
    return this.export(coder, true);
  }

  public isInProgress(): boolean {
    return Array.from(this.exports.values()).some(
      (exportStatement) => !exportStatement.done,
    );
  }

  public finished(): Promise<(Coder | undefined)[]> {
    return Promise.all(
      Array.from(this.exports.values(), (value) => value.promise!),
    );
  }

  public externalImportStatements(): string[] {
    return Array.from(
      this.externalImport,
      ([name, { isDefault, isType, modulePath }]) =>
        `import${isType ? " type" : ""} ${
          isDefault ? name : `{ ${name} }`
        } from "${modulePath}";`,
    );
  }

  public importStatements(): string[] {
    return Array.from(this.imports, ([name, { isDefault, isType, script }]) => {
      const resolvedPath = escapePathForWindows(
        nodePath
          .relative(
            nodePath.dirname(this.path).replaceAll("\\", "/"),
            script.path.replace(/\.ts$/u, ".js"),
          )
          .replaceAll("\\", "/"),
      );

      return `import${isType ? " type" : ""} ${
        isDefault ? name : `{ ${name} }`
      } from "${resolvedPath.includes("../") ? "" : "./"}${resolvedPath}";`;
    });
  }

  public exportStatements(): string[] {
    return Array.from(
      this.exports.values(),
      ({ beforeExport, code, isDefault, isType, name, typeDeclaration }) => {
        if (typeof code === "object" && code !== null && "raw" in code) {
          return code.raw;
        }

        if (isDefault) {
          return `${beforeExport}export default ${code as string};`;
        }

        const keyword = isType ? "type" : "const";
        const typeAnnotation =
          (typeDeclaration ?? "").length === 0
            ? ""
            : `:${typeDeclaration ?? ""}`;

        return `${beforeExport}export ${keyword} ${name ?? ""}${typeAnnotation} = ${code as string};`;
      },
    );
  }

  public contents(): Promise<string> {
    return format(
      [
        this.comments.map((comment) => `// ${comment}`).join("\n"),
        this.comments.length > 0 ? "\n\n" : "",
        this.externalImportStatements().join("\n"),
        this.importStatements().join("\n"),
        "\n\n",
        this.exportStatements().join("\n\n"),
      ].join(""),
      { parser: "typescript" },
    );
  }
}
