type Module = string | undefined;

interface File {
  isWildcard: boolean;
  module: Module;
  name: string;
}

interface Directory {
  directories: { [key: string]: Directory };
  files: { [key: string]: File };
  isWildcard: boolean;
  name: string;
}

interface Match {
  module: Module;
  pathVariables: { [key: string]: string };
}

function isDirectory(test: unknown): test is Directory {
  return test !== undefined;
}

const NO_MATCH = {
  module: undefined,
  pathVariables: {},
};

export class ModuleTree {
  public readonly root: Directory = {
    directories: {},
    files: {},
    isWildcard: false,
    name: "",
  };

  private addModuleToDirectory(
    directory: Directory,
    segments: string[],
    module: Module,
  ) {
    const [segment, ...remainingSegments] = segments;
    if (remainingSegments.length === 0) {
      directory.files[segment.toLowerCase()] = {
        isWildcard: segment.startsWith("{"),
        module,
        name: segment.replace(/^\{(?<name>.*)\}$/u, "$<name>"),
      };
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    directory.directories[segment.toLowerCase()] ??= {
      directories: {},
      files: {},
      isWildcard: segment.startsWith("{"),
      name: segment.replace(/^\{(?<name>.*)\}$/u, "$<name>"),
    };
    this.addModuleToDirectory(
      directory.directories[segment.toLowerCase()],
      remainingSegments,
      module,
    );
  }

  public add(url: string, module: Module) {
    this.addModuleToDirectory(this.root, url.split("/").slice(1), module);
  }

  private removeModuleFromDirectory(directory: Directory, segments: string[]) {
    const [segment, ...remainingSegments] = segments;
    if (remainingSegments.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
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
    const [segment, ...remainingSegments] = segments;
    this.removeModuleFromDirectory(
      this.root.directories[segment.toLowerCase()],
      remainingSegments,
    );
  }

  private buildMatch(
    directory: Directory,
    segment: string,
    pathVariables: { [key: string]: string },
  ) {
    const match =
      directory.files[segment.toLowerCase()] ??
      Object.values(directory.files).find((file) => file.isWildcard);

    if (match === undefined) {
      return NO_MATCH;
    }

    if (match.isWildcard) {
      return {
        ...match,

        pathVariables: {
          ...pathVariables,
          [match.name]: segment,
        },
      };
    }

    return {
      ...match,

      pathVariables,
    };
  }

  // eslint-disable-next-line max-statements
  private matchWithinDirectory(
    directory: Directory,
    segments: string[],
    pathVariables: { [key: string]: string },
  ): Match {
    if (segments.length === 0) {
      return NO_MATCH;
    }
    const [segment, ...remainingSegments] = segments;

    if (remainingSegments.length === 0) {
      return this.buildMatch(directory, segment, pathVariables);
    }

    if (isDirectory(directory.directories[segment.toLowerCase()])) {
      return this.matchWithinDirectory(
        directory.directories[segment.toLowerCase()],
        remainingSegments,
        pathVariables,
      );
    }

    const wildcardDirectory = Object.values(directory.directories).find(
      (subdirectory) => subdirectory.isWildcard,
    );

    if (wildcardDirectory) {
      return this.matchWithinDirectory(wildcardDirectory, remainingSegments, {
        ...pathVariables,
        [wildcardDirectory.name]: segment,
      });
    }

    return NO_MATCH;
  }

  public match(url: string) {
    return this.matchWithinDirectory(this.root, url.split("/").slice(1), {});
  }
}