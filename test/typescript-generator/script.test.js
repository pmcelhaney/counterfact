// eslint-disable-next-line import/no-extraneous-dependencies
import { jest } from "@jest/globals";

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

    const coder5 = new AccountTypeCoder(mockRequirement);

    expect(script.import(coder1, "file.ts")).toBe("Account");
    expect(script.import(coder2, "file.ts")).toBe("Account");
    expect(script.import(coder3, "file.ts")).toBe("Account2");
    expect(script.import(coder4, "file.ts")).toBe("Account3");
    expect(script.import(coder5, "other.ts")).toBe("Account4");
  });

  it("when asked to import, registers an export on the target script", () => {
    const repository = new Repository("/base/path");

    class CoderThatWantsToImportAccount extends Coder {
      *names() {
        yield "Account";
      }
    }

    const coder = new CoderThatWantsToImportAccount({});

    const importingScript = repository.get("import-to-me.ts");
    const exportingScript = repository.get("export-from-me.ts");

    importingScript.import(coder, "export-from-me.ts");

    expect(importingScript.imports.get("Account")).toStrictEqual({
      script: exportingScript,
      name: "Account",
      isType: false,
    });
  });

  it("creates import statements", () => {
    const repository = new Repository("/base/path");

    class CoderThatWantsToImportAccount extends Coder {
      *names() {
        let index = 0;

        while (true) {
          yield `Account${index}`;
          index += 1;
        }
      }
    }

    const coder = new CoderThatWantsToImportAccount({});

    const script = repository.get("import-to-me.ts");

    script.import(coder, "export-from-me.ts");
    script.importType(coder, "export-from-me.ts");

    expect(script.importStatements()).toStrictEqual([
      'import { Account0 } from "./export-from-me.js";',
      'import type { Account1 } from "./export-from-me.js";',
    ]);
  });

  it("creates export statements", async () => {
    const repository = new Repository("/base/path");

    class CoderThatWantsToImportAccount extends Coder {
      *names() {
        let index = 0;

        while (true) {
          yield `Account${index}`;
          index += 1;
        }
      }

      write() {
        return "{ }";
      }
    }

    const coder = new CoderThatWantsToImportAccount({});

    const script = repository.get("export-to-me.ts");

    script.export(coder);
    script.exportType(coder);

    await script.finished();

    expect(script.exportStatements()).toStrictEqual([
      "export const Account0 = { };",
      "export type Account1 = { };",
    ]);
  });

  it("outputs the contents (import and export statements)", () => {
    const repository = new Repository("/base/path");

    const script = repository.get("script.ts");

    jest
      .spyOn(script, "importStatements")
      .mockImplementation(() => ["import { foo } from './foo.js;"]);

    jest
      .spyOn(script, "exportStatements")
      .mockImplementation(() => ['export const bar = "Bar";']);

    expect(script.contents()).toBe(
      'import { foo } from \'./foo.js;\nexport const bar = "Bar";'
    );
  });
});
