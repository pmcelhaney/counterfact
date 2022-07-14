import { Repository } from "../../src/typescript-generator/repository.js";

describe("a Repository", () => {
  it("creates a new Script or returns an existing one", () => {
    const repository = new Repository("/base/path");

    const a = repository.get("a.ts");
    const b = repository.get("b.ts");
    const a2 = repository.get("a.ts");

    expect(a).not.toBe(b);
    expect(a2).toBe(a);
  });
});
