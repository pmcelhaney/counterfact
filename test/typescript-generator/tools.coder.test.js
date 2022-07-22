/* eslint-disable jest/no-restricted-matchers */
import { ToolsCoder } from "../../src/typescript-generator/tools-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

describe("a ToolsCoder", () => {
  it("has all hard-coded return values", async () => {
    const coder = new ToolsCoder(new Requirement({}));

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual(["Tools", "Tools2", "Tools3"]);

    expect(coder.id).toBe("tools");
    expect(coder.modulePath()).toBe("internal/tools.ts");
    await expect(coder.delegate()).resolves.toBe(coder);

    expect(
      coder.write({
        importExternal(name, path) {
          coder.imported = { name, path };
        },
      })
    ).toMatchSnapshot();

    expect(coder.imported).toStrictEqual({
      name: "JSONSchema6",
      path: "json-schema",
    });
  });
});
