import prettier from "prettier";

import { ContextCoder } from "../../src/typescript-generator/context-coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

function format(code) {
  return prettier.format(code, { parser: "typescript" });
}

const dummyScript = {
  import() {
    return "schema";
  },

  importDefault() {
    return "default";
  },

  importExternalType() {
    return "ExternalType";
  },

  importType() {
    return "Type";
  },

  path: ".",

  repository: {
    get() {
      return {
        exportDefault() {
          return "noop";
        },
      };
    },
  },
};

describe("a ContextCoder", () => {
  it("generates a list of potential names", () => {
    const coder = new ContextCoder({ url: "#/components/schemas/Person" });

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual([
      "Context",
      "Context2",
      "Context3",
    ]);
  });

  it("when asked to delegate an inline requirement, returns itself", async () => {
    const coder = new ContextCoder(new Requirement({ type: "string" }));

    await expect(coder.delegate()).resolves.toBe(coder);
  });

  it("has a static ID", () => {
    const coder = new ContextCoder({ url: "#/paths/hello/get" });

    expect(coder.id).toBe("ContextCoder");
  });

  it("finds the request method in the URL", async () => {
    const coder = new ContextCoder(new Requirement({}, "#/paths/hello/get"));

    await expect(
      format(coder.write(dummyScript).raw),
    ).resolves.toMatchSnapshot();
  });
});
