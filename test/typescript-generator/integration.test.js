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

    class OperationCoder extends Coder {
      *names() {
        yield `HTTP_${this.requirement.url.split("/").at(-1).toUpperCase()}`;
      }

      write() {
        return "() => {}";
      }
    }

    requirement.forEach(([key, pathDefinition]) => {
      pathDefinition.forEach(([, operation]) => {
        repository.get(`paths${key}.ts`).export(new OperationCoder(operation));
      });
    });

    const account = repository.get("paths/accounts.ts");
    const accountId = repository.get("paths/accounts/{id}.ts");

    await account.finished();

    expect(account.contents()).toBe(
      "export const HTTP_GET = () => {};\nexport const HTTP_POST = () => {};"
    );
    expect(accountId.contents()).toBe(
      "export const HTTP_GET = () => {};\nexport const HTTP_PUT = () => {};"
    );
  });
});
