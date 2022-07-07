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

  it("does not recreate an import if a match already exists", () => {
    const script = new Repository("/base/path").get("script.ts");

    class AccountCoder extends Coder {}

    class AccountTypeCoder extends Coder {}

    const mockRequirement = {
      url: "openapi.yaml#/components/schemas/Account",
    };

    const coder1 = new AccountCoder(mockRequirement);
    const coder2 = new AccountCoder(mockRequirement);
    const coder3 = new AccountTypeCoder(mockRequirement);
    const coder4 = new AccountCoder({
      url: "/different/url/ending/in/Account",
    });

    expect(script.import(coder1)).toBe("Account");
    expect(script.import(coder2)).toBe("Account");
    expect(script.import(coder3)).toBe("Account2");
    expect(script.import(coder4)).toBe("Account3");
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

    const coder = new CoderThatWantsToImportAccount({});

    const importingScript = repository.get("import-to-me.ts");
    const exportingScript = repository.get("export-from-me.ts");

    importingScript.import(coder);

    expect(importingScript.imports.get("Account")).toStrictEqual({
      script: exportingScript,
      name: "Account",
    });
  });

  it("creates import statements", () => {
    const repository = new Repository("/base/path");

    class CoderThatWantsToImportAccount extends Coder {
      name() {
        return "Account";
      }

      get scriptPath() {
        return "export-from-me.ts";
      }
    }

    const coder = new CoderThatWantsToImportAccount({});

    const script = repository.get("import-to-me.ts");

    script.import(coder);

    expect(script.importStatements()).toStrictEqual([
      'import Account from "./export-from-me.ts";',
    ]);
  });
});
