import prettier from "prettier";

import { ContextTypeCoder } from "../../src/typescript-generator/context-type-coder.js";
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

describe("a ContextTypeCoder", () => {
  it("extends the Context from the parent directory", async () => {
    const coder = new ContextTypeCoder(
      new Requirement({}, "#/paths/hello/get"),
    );

    await expect(format(coder.write(dummyScript).raw)).resolves.toBe(
      await format('export { Context } from "../_.context.js";'),
    );
  });

  it("defines the Context class in the root", async () => {
    const coder = new ContextTypeCoder(new Requirement({}, "#/paths"));

    const dummyScriptWithRootPath = {
      ...dummyScript,
      path: "paths/_.context.ts",
    };

    await expect(
      format(coder.write(dummyScriptWithRootPath).raw),
    ).resolves.toBe(await format("export class Context {};"));
  });
});
