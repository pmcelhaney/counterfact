import { describe, expect, it } from "@jest/globals";

import { Coder } from "../../src/typescript-generator/coder.js";
import { Requirement } from "../../src/typescript-generator/requirement.js";
import { Specification } from "../../src/typescript-generator/specification.js";

describe("a Coder", () => {
  it("generates a list of potential names", () => {
    const coder = new Coder({ url: "#/components/schemas/Person" });

    const [one, two, three] = coder.names();

    expect([one, two, three]).toStrictEqual(["Person", "Person2", "Person3"]);
  });

  it("makes non-alphanumeric names valid variable names", () => {
    const coder = new Coder({ url: "#/components/schemas/5i.am.strange.1$!" });

    const [one, two] = coder.names();

    expect([one, two]).toStrictEqual([
      "_5i_am_strange_1$_",
      "_5i_am_strange_1$_2",
    ]);
  });

  it("generates a list of potential names given a starting point", () => {
    const coder = new Coder({ url: "#/components/schemas/Person" });

    const [one, two, three] = coder.names("FunkyPerson");

    expect([one, two, three]).toStrictEqual([
      "FunkyPerson",
      "FunkyPerson2",
      "FunkyPerson3",
    ]);
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
      '{ name: "example", account: Account }',
    );
  });

  it("when asked to delegate an inline requirement, returns itself", async () => {
    const coder = new Coder(new Requirement({ type: "string" }));

    await expect(coder.delegate()).resolves.toBe(coder);
  });

  it("when asked to delegate a requirement that is a $ref, looks up the $ref and returns another coder of the same type with an inline requirement", async () => {
    const specification = new Specification("openapi.yaml");

    specification.cache.set("openapi.yaml", {
      components: { schemas: { Person: { type: "string" } } },
    });

    class DelegatingCoder extends Coder {}

    const coder = new DelegatingCoder(
      new Requirement(
        { $ref: "#/components/schemas/Person" },
        "",
        specification,
      ),
    );

    const otherCoder = await coder.delegate();

    expect(otherCoder).not.toBe(coder);
    expect(otherCoder.requirement.data).toStrictEqual({ type: "string" });
    expect(otherCoder.constructor.name).toBe("DelegatingCoder");
  });
});
