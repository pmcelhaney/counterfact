import { Repository } from "../../src/typescript-generator/repository.js";
import { Specification } from "../../src/typescript-generator/specification.js";
import { Coder } from "../../src/typescript-generator/coder.js";

describe("integration Test", () => {
  it("writes some code", async () => {
    const specification = new Specification();

    specification.cache.set("openapi.yaml", {
      paths: {
        "/accounts": {},
        "/accounts/{id}": {},
      },
    });

    const repository = new Repository();
    const requirement = await specification.requirementAt(
      "openapi.yaml#/paths"
    );

    class PathCoder extends Coder {
      write() {
        return "{}";
      }
    }

    requirement.forEach(([key, pathDefinition]) => {
      repository.get(`paths${key}.ts`).export(new PathCoder(pathDefinition));
    });

    const account = repository.get("paths/accounts.ts");

    await account.finished();

    expect(account.contents()).toBe("\n\nexport const accounts = {};\n");
  });
});
