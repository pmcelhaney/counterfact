class Importer {
  constructor() {
    this.paths = {};
  }

  add(path, get) {
    this.paths[path] = get;
  }

  exists(path) {
    return path in this.paths;
  }

  get(path) {
    return this.paths[path].GET;
  }
}

describe("importer", () => {
  it("knows if a path exists", () => {
    const importer = new Importer();

    importer.add("/hello");

    expect(importer.exists("/hello")).toBe(true);
    expect(importer.exists("/goodbye")).toBe(false);
  });

  it("looks up a get method", () => {
    const importer = new Importer();

    importer.add("/hello", {
      GET() {
        return { body: "hello" };
      },
    });

    expect(importer.get("/hello")().body).toBe("hello");
  });
});
