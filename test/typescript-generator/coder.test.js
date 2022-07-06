import { Coder } from "../../src/typescript-generator/coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

describe("a Coder", () => {
  it("finds a name that does not collide with a given set of names", () => {
    const spec = {};
    const coder = new Coder(spec, "#/components/schemas/Person");
    const namespace = new Set(["Person", "Person2", "Person3"]);

    expect(coder.name("#/components/schemas/Person", namespace)).toBe(
      "Person4"
    );
  });

  it("writes code synchronously given a requirement", () => {
    class JsonCoder extends Coder {
      write(requirement) {
        return JSON.stringify(requirement.data);
      }
    }

    const requirement = new Requirement("#/components/schemas/Person", {
      name: "Alice",
    });

    expect(new JsonCoder().write(requirement)).toBe('{"name":"Alice"}');
  });

  it("can reference an object that will be imported", () => {
    class DelegatingCoder extends Coder {
      write(requirement, script) {
        const accountCoder = new Coder();

        return `{ name: "${requirement.name}", account: new ${script.import(
          accountCoder
        )}() }`;
      }
    }

    const script = {
      import() {
        return "Account";
      },
    };

    expect(new DelegatingCoder().write({ name: "example" }, script)).toBe(
      '{ name: "example", account: new Account() }'
    );
  });
});
