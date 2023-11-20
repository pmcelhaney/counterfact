type Module = string;

interface File {
  isWildcard: boolean;
  module: Module;
}

interface Directory {
  directories: { [key: string]: Directory };
  files: { [key: string]: File };
  isWildcard: boolean;
}

class ModuleTree {
  private readonly root: Directory = {
    directories: {},
    files: {},
    isWildcard: false,
  };

  private addModuleToDirectory(
    directory: Directory,
    segments: string[],
    module: Module,
  ) {
    const [segment, ...remainingSegments] = segments;
    if (remainingSegments.length === 0) {
      directory.files[segment] = {
        isWildcard: segment.startsWith("{"),
        module,
      };
      return;
    }
    directory.directories[segment] ??= {
      directories: {},
      files: {},
      isWildcard: segment.startsWith("{"),
    };
    this.addModuleToDirectory(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      directory.directories[segment],
      remainingSegments,
      module,
    );
  }

  public add(url: string, module: Module) {
    this.addModuleToDirectory(this.root, url.split("/").slice(1), module);
  }

  private matchWithinDirectory(
    directory: Directory,
    segments: string[],
  ): File | undefined {
    if (segments.length === 0) {
      return undefined;
    }
    const [segment, ...remainingSegments] = segments;

    if (remainingSegments.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return (
        directory.files[segment] ??
        Object.values(directory.files).find((file) => file.isWildcard)
      );
    }

    function isDirectory(test: unknown): test is Directory {
      return test !== undefined;
    }

    if (isDirectory(directory.directories[segment])) {
      return this.matchWithinDirectory(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        directory.directories[segment] as Directory,
        remainingSegments,
      );
    }

    const wildcardDirectory = Object.values(directory.directories).find(
      (subdirectory) => subdirectory.isWildcard,
    );

    if (wildcardDirectory) {
      return this.matchWithinDirectory(wildcardDirectory, remainingSegments);
    }

    return undefined;
  }

  public match(url: string): Module | undefined {
    return this.matchWithinDirectory(this.root, url.split("/").slice(1))
      ?.module;
  }
}

it("returns undefined for /", () => {
  const moduleTree = new ModuleTree();
  expect(moduleTree.match("/")).toBe(undefined);
});

it("finds a file at the root", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  expect(moduleTree.match("/a")).toBe("a");
});

it("finds a file under a subdirectory", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "b");
  expect(moduleTree.match("/a")).toBe("a");
  expect(moduleTree.match("/a/b")).toBe("b");
});

it("finds a file with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/{x}", "b");
  expect(moduleTree.match("/a")).toBe("a");
  expect(moduleTree.match("/a/b")).toBe("b");
});

it("finds a directory with a wildcard match", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/{x}/b", "b");
  expect(moduleTree.match("/a")).toBe("a");
  expect(moduleTree.match("/a/b")).toBe("b");
});

it("prefers an exact match to a wildcard", () => {
  const moduleTree = new ModuleTree();
  moduleTree.add("/a", "a");
  moduleTree.add("/a/b", "exact");
  moduleTree.add("/a/{x}", "wildcard");
  expect(moduleTree.match("/a")).toBe("a");
  expect(moduleTree.match("/a/b")).toBe("exact");
});

export default ModuleTree;
