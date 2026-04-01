import { parseDsl, parseDslLine } from "../../../src/repl/agent/dsl-parser.js";

describe("parseDslLine", () => {
  describe("property assignments", () => {
    it("parses a boolean true assignment", () => {
      expect(parseDslLine("context.checkout.fail = true")).toEqual({
        kind: "set",
        path: ["checkout", "fail"],
        value: true,
      });
    });

    it("parses a boolean false assignment", () => {
      expect(parseDslLine("context.checkout.fail = false")).toEqual({
        kind: "set",
        path: ["checkout", "fail"],
        value: false,
      });
    });

    it("parses a number assignment", () => {
      expect(parseDslLine("context.checkout.latencyMs = 2000")).toEqual({
        kind: "set",
        path: ["checkout", "latencyMs"],
        value: 2000,
      });
    });

    it("parses a string assignment", () => {
      expect(parseDslLine('context.store.name = "my store"')).toEqual({
        kind: "set",
        path: ["store", "name"],
        value: "my store",
      });
    });

    it("parses a null assignment", () => {
      expect(parseDslLine("context.user.session = null")).toEqual({
        kind: "set",
        path: ["user", "session"],
        value: null,
      });
    });

    it("parses an object assignment", () => {
      expect(parseDslLine('context.store.config = { "key": "value" }')).toEqual(
        {
          kind: "set",
          path: ["store", "config"],
          value: { key: "value" },
        },
      );
    });

    it("parses an array assignment", () => {
      expect(parseDslLine("context.store.ids = [1, 2, 3]")).toEqual({
        kind: "set",
        path: ["store", "ids"],
        value: [1, 2, 3],
      });
    });

    it("parses a single-segment path assignment", () => {
      expect(parseDslLine("context.flag = true")).toEqual({
        kind: "set",
        path: ["flag"],
        value: true,
      });
    });

    it("strips a trailing semicolon", () => {
      expect(parseDslLine("context.checkout.fail = true;")).toEqual({
        kind: "set",
        path: ["checkout", "fail"],
        value: true,
      });
    });
  });

  describe("method calls", () => {
    it("parses a method call with an object argument", () => {
      expect(parseDslLine('context.store.addPet({ "type": "cat" })')).toEqual({
        kind: "call",
        path: ["store", "addPet"],
        args: [{ type: "cat" }],
      });
    });

    it("parses a method call with a numeric argument", () => {
      expect(parseDslLine("context.store.deletePet(42)")).toEqual({
        kind: "call",
        path: ["store", "deletePet"],
        args: [42],
      });
    });

    it("parses a method call with multiple arguments", () => {
      expect(parseDslLine('context.store.renamePet(1, "Fido")')).toEqual({
        kind: "call",
        path: ["store", "renamePet"],
        args: [1, "Fido"],
      });
    });

    it("parses a method call with no arguments", () => {
      expect(parseDslLine("context.store.reset()")).toEqual({
        kind: "call",
        path: ["store", "reset"],
        args: [],
      });
    });

    it("parses a deeply nested method call", () => {
      expect(parseDslLine("context.a.b.c.doThing(1)")).toEqual({
        kind: "call",
        path: ["a", "b", "c", "doThing"],
        args: [1],
      });
    });

    it("strips a trailing semicolon from a method call", () => {
      expect(parseDslLine('context.store.addPet({ "type": "cat" });')).toEqual({
        kind: "call",
        path: ["store", "addPet"],
        args: [{ type: "cat" }],
      });
    });
  });

  describe("error handling", () => {
    it("throws when the statement does not start with 'context.'", () => {
      expect(() => parseDslLine("foo.bar = 1")).toThrow(
        /must start with "context\./,
      );
    });

    it("throws for an assignment with no value", () => {
      expect(() => parseDslLine("context.x =")).toThrow(/Missing value/);
    });

    it("throws for a method call with unclosed parenthesis", () => {
      expect(() => parseDslLine("context.store.addPet({")).toThrow(
        /Unclosed parenthesis/,
      );
    });

    it("throws when the value is not valid JSON", () => {
      expect(() => parseDslLine("context.x = undefined")).toThrow(
        /Invalid JSON value/,
      );
    });

    it("throws when arguments are not valid JSON", () => {
      expect(() => parseDslLine("context.store.addPet(undefined)")).toThrow(
        /Invalid argument list/,
      );
    });

    it("throws for eval() usage", () => {
      expect(() => parseDslLine("context.x = eval('1')")).toThrow(
        /Unsafe construct "eval\(\)"/,
      );
    });

    it("throws for new keyword", () => {
      expect(() => parseDslLine("context.x = new Date()")).toThrow(
        /Unsafe construct "new"/,
      );
    });

    it("throws for computed property access on context", () => {
      // context["x"] fails the "must start with context." check.
      expect(() => parseDslLine('context["x"] = 1')).toThrow();
      // context.a["x"] gets past the prefix check but the path
      // stops at "[" and the remainder is not "=" or "(", so it
      // also throws.
      expect(() => parseDslLine('context.a["x"] = 1')).toThrow();
    });

    it("throws for statements that are neither assignment nor method call", () => {
      expect(() => parseDslLine("context.x")).toThrow(
        /Expected "=" for assignment or "\(\)" for method call/,
      );
    });

    it("throws for .prototype access", () => {
      expect(() => parseDslLine("context.store.prototype.evil = 1")).toThrow(
        /Unsafe construct "\.prototype"/,
      );
    });

    it("throws for .constructor access", () => {
      expect(() => parseDslLine("context.store.constructor.call()")).toThrow(
        /Unsafe construct "\.constructor"/,
      );
    });
  });
});

describe("parseDsl", () => {
  it("parses multiple statements", () => {
    const dsl = `
      context.checkout.fail = true
      context.store.addPet({ "type": "cat" })
    `;

    expect(parseDsl(dsl)).toEqual([
      { kind: "set", path: ["checkout", "fail"], value: true },
      { kind: "call", path: ["store", "addPet"], args: [{ type: "cat" }] },
    ]);
  });

  it("ignores empty lines", () => {
    const dsl = `
      context.a = 1

      context.b = 2
    `;

    expect(parseDsl(dsl)).toHaveLength(2);
  });

  it("ignores comment lines starting with //", () => {
    const dsl = `
      // This is a comment
      context.a = 1
      // Another comment
    `;

    expect(parseDsl(dsl)).toEqual([{ kind: "set", path: ["a"], value: 1 }]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseDsl("")).toEqual([]);
  });

  it("returns an empty array for a string containing only comments", () => {
    expect(parseDsl("// comment\n// another")).toEqual([]);
  });

  it("throws on the first invalid statement", () => {
    const dsl = `
      context.a = 1
      invalid statement
    `;

    expect(() => parseDsl(dsl)).toThrow();
  });
});
