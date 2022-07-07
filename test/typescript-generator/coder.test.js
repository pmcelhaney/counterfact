import { Coder } from "../../src/typescript-generator/coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";

describe("a Coder", () => {
  it("finds a name that does not collide with a given set of names", () => {
    const coder = new Coder({ url: "#/components/schemas/Person" });
    const namespace = new Set(["Person", "Person2", "Person3"]);

    expect(coder.name(namespace)).toBe("Person4");
  });

  it("writes code synchronously given a requirement that is loaded", () => {
    class JsonCoder extends Coder {
      write() {
        return JSON.stringify(this.requirement.data);
      }
    }

    const requirement = new Requirement({
      name: "Alice",
    });

    expect(new JsonCoder(requirement).write()).toBe('{"name":"Alice"}');
  });

  it("references an object that will written by another coder instance and imported into the script", () => {
    class DelegatingCoder extends Coder {
      write(script) {
        const accountCoder = new Coder();

        return `{ name: "${
          this.requirement.data.name
        }", account: ${script.import(accountCoder)} }`;
      }
    }

    const script = {
      import() {
        return "Account";
      },
    };

    const requirement = new Requirement({
      name: "example",
    });

    expect(new DelegatingCoder(requirement).write(script)).toBe(
      '{ name: "example", account: Account }'
    );
  });
});
