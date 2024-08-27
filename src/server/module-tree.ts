import type { Module } from "./registry.js";

interface Route {
  methods: { [key: string]: string };
  path: string;
}

interface File {
  isWildcard: boolean;
  module: Module;
  name: string;
  rawName: string;
}

interface Directory {
  directories: { [key: string]: Directory };
  files: { [key: string]: File };
  isWildcard: boolean;
  name: string;
  rawName: string;
}

interface Match {
  matchedPath: string;
  module: Module;
  pathVariables: { [key: string]: string };
}

function isDirectory(test: Directory | undefined): test is Directory {
  return test !== undefined;
}

export class ModuleTree {
  public readonly root: Directory = {
    directories: {},
    files: {},
    isWildcard: false,
    name: "",
    rawName: "",
  };

  private addModuleToDirectory(
    directory: Directory | undefined,
    segments: string[],
    module: Module,
  ) {
    if (directory === undefined) {
      return;
    }

    const [segment, ...remainingSegments] = segments;

    if (segment === undefined) {
      throw new Error("segments array is empty");
    }

    if (remainingSegments.length === 0) {
      directory.files[segment.toLowerCase()] = {
        isWildcard: segment.startsWith("{"),
        module,
        name: segment.replace(/^\{(?<name>.*)\}$/u, "$<name>"),
        rawName: segment,
      };

      return;
    }

    directory.directories[segment.toLowerCase()] ??= {
      directories: {},
      files: {},
      isWildcard: segment.startsWith("{"),
      name: segment.replace(/^\{(?<name>.*)\}$/u, "$<name>"),
      rawName: segment,
    };
    this.addModuleToDirectory(
      directory.directories[segment.toLocaleLowerCase()],
      remainingSegments,
      module,
    );
  }

  public add(url: string, module: Module) {
    this.addModuleToDirectory(this.root, url.split("/").slice(1), module);
  }

  private removeModuleFromDirectory(
    directory: Directory | undefined,
    segments: string[],
  ) {
    if (!isDirectory(directory)) {
      return;
    }

    const [segment, ...remainingSegments] = segments;

    if (segment === undefined) {
      return;
    }

    if (remainingSegments.length === 0) {
      delete directory.files[segment.toLowerCase()];

      return;
    }

    this.removeModuleFromDirectory(
      directory.directories[segment.toLowerCase()],
      remainingSegments,
    );
  }

  public remove(url: string) {
    const segments = url.split("/").slice(1);

    this.removeModuleFromDirectory(this.root, segments);
  }

  private buildMatch(
    directory: Directory,
    segment: string,
    pathVariables: { [key: string]: string },
    matchedPath: string,
  ) {
    const match =
      directory.files[segment.toLowerCase()] ??
      Object.values(directory.files).find((file) => file.isWildcard);

    if (match === undefined) {
      return undefined;
    }

    if (match.isWildcard) {
      return {
        ...match,

        matchedPath: `${matchedPath}/${match.rawName}`,

        pathVariables: {
          ...pathVariables,
          [match.name]: segment,
        },
      };
    }

    return {
      ...match,

      matchedPath: `${matchedPath}/${match.rawName}`,

      pathVariables,
    };
  }

  private matchWithinDirectory(
    directory: Directory,
    segments: string[],
    pathVariables: { [key: string]: string },
    matchedPath: string,
  ): Match | undefined {
    if (segments.length === 0) {
      return undefined;
    }

    const [segment, ...remainingSegments] = segments;

    if (segment === undefined) {
      throw new Error(
        "segment cannot be undefined but TypeScript doesn't know that",
      );
    }

    if (
      remainingSegments.length === 0 ||
      (remainingSegments.length === 1 && remainingSegments[0] === "")
    ) {
      return this.buildMatch(directory, segment, pathVariables, matchedPath);
    }

    const exactMatch = directory.directories[segment.toLowerCase()];

    if (isDirectory(exactMatch)) {
      return this.matchWithinDirectory(
        exactMatch,
        remainingSegments,
        pathVariables,
        `${matchedPath}/${segment}`,
      );
    }

    const wildcardDirectory = Object.values(directory.directories).find(
      (subdirectory) => subdirectory.isWildcard,
    );

    if (wildcardDirectory) {
      return this.matchWithinDirectory(
        wildcardDirectory,
        remainingSegments,
        {
          ...pathVariables,
          [wildcardDirectory.name]: segment,
        },
        `${matchedPath}/${wildcardDirectory.rawName}`,
      );
    }

    return undefined;
  }

  public match(url: string) {
    return this.matchWithinDirectory(
      this.root,
      url.split("/").slice(1),
      {},
      "",
    );
  }

  public get routes(): Route[] {
    const routes: Route[] = [];

    function traverse(directory: Directory, path: string) {
      Object.values(directory.directories).forEach((subdirectory) => {
        traverse(subdirectory, `${path}/${subdirectory.rawName}`);
      });

      Object.values(directory.files).forEach((file) => {
        const methods: [string, string][] = Object.entries(file.module).map(
          ([method, implementation]) => [method, String(implementation)],
        );

        routes.push({
          methods: Object.fromEntries(methods),
          path: `${path}/${file.rawName}`,
        });
      });
    }

    function stripBrackets(string: string) {
      return string.replaceAll(/\{|\}/gu, "");
    }

    traverse(this.root, "");

    return routes.sort((first, second) =>
      stripBrackets(first.path).localeCompare(stripBrackets(second.path)),
    );
  }
}
