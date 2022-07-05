import { Tools } from "../src/tools.js";

describe("tools", () => {
  it("oneOf()", () => {
    const tools = new Tools();

    expect(["A", "B", "C"]).toContain(tools.oneOf(["A", "B", "C"]));
  });
});
