import { jest } from "@jest/globals";

import {
  executeOperation,
  executeOperations,
} from "../../../src/repl/agent/interpreter.js";

describe("executeOperation", () => {
  describe("set operations", () => {
    it("sets a top-level property", () => {
      const context: Record<string, unknown> = { flag: false };

      executeOperation(context, { kind: "set", path: ["flag"], value: true });

      expect(context.flag).toBe(true);
    });

    it("sets a nested property", () => {
      const context: Record<string, unknown> = { checkout: { fail: false } };

      executeOperation(context, {
        kind: "set",
        path: ["checkout", "fail"],
        value: true,
      });

      expect((context.checkout as Record<string, unknown>).fail).toBe(true);
    });

    it("sets a property to a JSON object", () => {
      const context: Record<string, unknown> = { store: {} };

      executeOperation(context, {
        kind: "set",
        path: ["store", "config"],
        value: { key: "value" },
      });

      expect((context.store as Record<string, unknown>).config).toEqual({
        key: "value",
      });
    });

    it("sets a property to null", () => {
      const context: Record<string, unknown> = { user: { session: "token" } };

      executeOperation(context, {
        kind: "set",
        path: ["user", "session"],
        value: null,
      });

      expect((context.user as Record<string, unknown>).session).toBeNull();
    });

    it("creates a new property when it does not yet exist", () => {
      const context: Record<string, unknown> = { store: {} };

      executeOperation(context, {
        kind: "set",
        path: ["store", "newProp"],
        value: 42,
      });

      expect((context.store as Record<string, unknown>).newProp).toBe(42);
    });

    it("throws when an intermediate path segment is missing", () => {
      const context: Record<string, unknown> = {};

      expect(() =>
        executeOperation(context, {
          kind: "set",
          path: ["missing", "prop"],
          value: true,
        }),
      ).toThrow(/does not exist/);
    });

    it("throws when an intermediate path segment is not an object", () => {
      const context: Record<string, unknown> = { count: 42 };

      expect(() =>
        executeOperation(context, {
          kind: "set",
          path: ["count", "prop"],
          value: true,
        }),
      ).toThrow(/not an object/);
    });
  });

  describe("call operations", () => {
    it("calls a method with arguments", () => {
      const addPet = jest.fn();
      const context: Record<string, unknown> = { store: { addPet } };

      executeOperation(context, {
        kind: "call",
        path: ["store", "addPet"],
        args: [{ type: "cat" }],
      });

      expect(addPet).toHaveBeenCalledWith({ type: "cat" });
    });

    it("calls a method with no arguments", () => {
      const reset = jest.fn();
      const context: Record<string, unknown> = { store: { reset } };

      executeOperation(context, {
        kind: "call",
        path: ["store", "reset"],
        args: [],
      });

      expect(reset).toHaveBeenCalledWith();
    });

    it("calls a method with multiple arguments", () => {
      const renamePet = jest.fn();
      const context: Record<string, unknown> = { store: { renamePet } };

      executeOperation(context, {
        kind: "call",
        path: ["store", "renamePet"],
        args: [1, "Fido"],
      });

      expect(renamePet).toHaveBeenCalledWith(1, "Fido");
    });

    it("calls the method bound to its parent object", () => {
      let calledOnParent = false;
      const store: Record<string, unknown> = {
        marker: "store-marker",
      };

      store["captureThis"] = function () {
        calledOnParent =
          (this as Record<string, unknown>).marker === "store-marker";
      };

      const context: Record<string, unknown> = { store };

      executeOperation(context, {
        kind: "call",
        path: ["store", "captureThis"],
        args: [],
      });

      expect(calledOnParent).toBe(true);
    });

    it("throws when the method does not exist", () => {
      const context: Record<string, unknown> = { store: {} };

      expect(() =>
        executeOperation(context, {
          kind: "call",
          path: ["store", "nonExistent"],
          args: [],
        }),
      ).toThrow(/not a callable method/);
    });

    it("throws when the method path resolves to a non-function", () => {
      const context: Record<string, unknown> = { store: { count: 0 } };

      expect(() =>
        executeOperation(context, {
          kind: "call",
          path: ["store", "count"],
          args: [],
        }),
      ).toThrow(/not a callable method/);
    });
  });

  describe("path navigation edge cases", () => {
    it("throws for an empty path", () => {
      const context: Record<string, unknown> = {};

      expect(() =>
        executeOperation(context, { kind: "set", path: [], value: true }),
      ).toThrow(/path must not be empty/i);
    });

    it("throws when an intermediate segment is null", () => {
      const context: Record<string, unknown> = { a: null };

      expect(() =>
        executeOperation(context, {
          kind: "set",
          path: ["a", "b"],
          value: true,
        }),
      ).toThrow(/does not exist/);
    });

    it("throws when an intermediate segment is an array", () => {
      const context: Record<string, unknown> = { items: [1, 2, 3] };

      expect(() =>
        executeOperation(context, {
          kind: "set",
          path: ["items", "length"],
          value: 0,
        }),
      ).toThrow(/not an object/);
    });
  });
});

describe("executeOperations", () => {
  it("executes multiple operations in sequence", () => {
    const addPet = jest.fn();
    const context: Record<string, unknown> = {
      checkout: { fail: false },
      store: { addPet },
    };

    const result = executeOperations(context, [
      { kind: "set", path: ["checkout", "fail"], value: true },
      { kind: "call", path: ["store", "addPet"], args: [{ type: "cat" }] },
    ]);

    expect((context.checkout as Record<string, unknown>).fail).toBe(true);
    expect(addPet).toHaveBeenCalledWith({ type: "cat" });
    expect(result.operationsExecuted).toBe(2);
    expect(result.operations).toHaveLength(2);
  });

  it("returns an empty result for an empty operation list", () => {
    const context: Record<string, unknown> = {};
    const result = executeOperations(context, []);

    expect(result.operationsExecuted).toBe(0);
    expect(result.operations).toEqual([]);
  });

  it("throws and stops execution on the first failing operation", () => {
    const fn = jest.fn();
    const context: Record<string, unknown> = { b: { fn } };

    expect(() =>
      executeOperations(context, [
        { kind: "set", path: ["missing", "prop"], value: true },
        { kind: "call", path: ["b", "fn"], args: [] },
      ]),
    ).toThrow(/does not exist/);

    expect(fn).not.toHaveBeenCalled();
  });
});
