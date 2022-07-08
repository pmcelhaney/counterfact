import { Repository } from "../../src/typescript-generator/repository.js";
import { Specification } from "../../src/typescript-generator/specification.js";
import { Coder } from "../../src/typescript-generator/coder.js";

describe("integration Test", () => {
  it("writes some code", async () => {
    const specification = new Specification();

    specification.cache.set("openapi.yaml", {
      paths: {
        "/accounts": {
          get: {},
          post: {},
        },

        "/accounts/{id}": {
          get: {},
          put: {},
        },
      },
    });

    const repository = new Repository();
    const requirement = await specification.requirementAt(
      "openapi.yaml#/paths"
    );

    class PathCoder extends Coder {
      name() {
        return "HTTP_GET";
      }

      write() {
        return "{}";
      }
    }

    requirement.forEach(([key, pathDefinition]) => {
      pathDefinition.forEach(([, operation]) => {
        repository.get(`paths${key}.ts`).export(new PathCoder(operation));
      });
    });

    const account = repository.get("paths/accounts.ts");
    const accountId = repository.get("paths/accounts/{id}.ts");

    await account.finished();

    expect(account.contents()).toBe("\n\nexport const HTTP_GET = {};\n");
    expect(accountId.contents()).toBe("\n\nexport const HTTP_GET = {};\n");
  });
});
