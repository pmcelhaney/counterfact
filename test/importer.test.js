class Importer {
  constructor() {
    this.paths = {};
  }

  add(path) {
    this.paths[path] = true;
  }

  exists(path) {
    return path in this.paths;
  }
}

describe("importer", () => {
  it("knows if a path exists", () => {
    const importer = new Importer();

    importer.add("/hello");

    expect(importer.exists("/hello")).toBe(true);
    expect(importer.exists("/goodbye")).toBe(false);
  });
});
