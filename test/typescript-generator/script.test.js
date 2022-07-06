import { Script } from "../../src/typescript-generator/script.js";
import { Coder } from "../../src/typescript-generator/coder.js";

describe("a File", () => {
  it("responds to an import request with the name of the imported module", () => {
    class CoderThatWantsToImportAccount extends Coder {
      name() {
        return "Account";
      }
    }

    const coder = new CoderThatWantsToImportAccount();

    const file = new Script();

    expect(file.import(coder)).toBe("Account");
  });

  it("registers an import", () => {
    class CoderThatWantsToImportAccount extends Coder {
      name() {
        return "Account";
      }

      get filePath() {
        return "path/to/export.ts";
      }
    }

    const coder = new CoderThatWantsToImportAccount();

    const file = new Script();

    file.import(coder);

    expect(file.imports.get("Account")).toBe("path/to/export.ts");
  });
});
