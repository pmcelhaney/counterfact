import { Coder } from "../../src/typescript-generator/coder.js";

describe("a Coder", () => {
  it("finds a name that does not collide with a given set of names", () => {
    const spec = {};
    const coder = new Coder(spec, "#/components/schemas/Person");
    const namespace = new Set(["Person", "Person2", "Person3"]);

    expect(coder.name(namespace)).toBe("Person4");
  });

  it("writes code synchronously given a requirement", () => {
    class JsonCoder extends Coder {
      write(file, requirement) {
        return JSON.stringify(requirement);
      }
    }

    expect(new JsonCoder().write(undefined, { example: 1 })).toBe(
      '{"example":1}'
    );
  });

  it("can pass another coder back to the file, ask the file to import the code which will be written by the coder", () => {
    class JsonCoder extends Coder {
      write(file, requirement) {
        const accountCoder = new Coder();

        return `{ name: "${requirement.name}", account: new ${file.import(
          accountCoder
        )}() }`;
      }
    }

    const file = {
      import() {
        return "Account";
      },
    };

    expect(new JsonCoder().write(file, { name: "example" })).toBe(
      '{ name: "example", account: new Account() }'
    );
  });
});
