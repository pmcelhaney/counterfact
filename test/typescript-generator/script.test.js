import { Script } from "../../src/typescript-generator/script.js";
import { Coder } from "../../src/typescript-generator/coder.js";

describe("a Script", () => {
  it("responds to an import request with the name of the imported module", () => {
    const coder = new Coder({
      url: "openapi.yaml#/components/schemas/Account",
    });
    const script = new Script();

    expect(script.import(coder)).toBe("Account");
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

    const script = new Script();

    script.import(coder);

    expect(script.imports.get("Account").path).toBe("path/to/export.ts");
  });
});
