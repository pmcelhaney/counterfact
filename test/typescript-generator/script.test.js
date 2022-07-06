import { Coder } from "../../src/typescript-generator/coder.js";
import { Repository } from "../../src/typescript-generator/repository.js";

describe("a Script", () => {
  it("responds to an import request with the name of the imported module", () => {
    const coder = new Coder({
      url: "openapi.yaml#/components/schemas/Account",
    });
    const script = new Repository("/base/path").get("script.ts");

    expect(script.import(coder)).toBe("Account");
  });

  it("when asked to import, registers an export on the target script", () => {
    const repository = new Repository("/base/path");

    class CoderThatWantsToImportAccount extends Coder {
      name() {
        return "Account";
      }

      get scriptPath() {
        return "export-from-me.ts";
      }
    }

    const coder = new CoderThatWantsToImportAccount();

    const importingScript = repository.get("import-to-me.ts");
    const exportingScript = repository.get("export-from-me.ts");

    importingScript.import(coder);

    expect(importingScript.imports.get("Account")).toStrictEqual({
      script: exportingScript,
      name: "Account",
    });
  });
});
