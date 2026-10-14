import vm from "node:vm";

import { describe, expect, it } from "@jest/globals";
import ts from "typescript";

import { SHOP_CONTEXT } from "../../src/cli/coffee-shop.js";

function context() {
  const exports = {} as {
    Context: new () => {
      inventory: Record<string, number>;
      setDecafStock: (quantity: number) => void;
      canFulfill: (items: { productId: string; quantity: number }[]) => boolean;
    };
  };
  vm.runInNewContext(
    ts.transpileModule(SHOP_CONTEXT, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports },
  );
  return new exports.Context();
}

describe("the example's shared context", () => {
  it("applies a changed Decaf setting once without undoing subsequent purchases", () => {
    const shop = context();
    shop.inventory = { "dark-roast": 3, decaf: 0 };
    shop.setDecafStock(5);
    expect(shop.inventory).toEqual({ "dark-roast": 3, decaf: 5 });
    shop.inventory.decaf -= 1;
    shop.setDecafStock(5);
    expect(shop.inventory.decaf).toBe(4);
    shop.setDecafStock(2);
    expect(shop.inventory.decaf).toBe(2);
  });

  it("checks the complete order without mutating inventory", () => {
    const shop = context();
    shop.inventory = { "dark-roast": 3 };
    expect(shop.canFulfill([{ productId: "dark-roast", quantity: 2 }])).toBe(
      true,
    );
    expect(
      shop.canFulfill([
        { productId: "dark-roast", quantity: 2 },
        { productId: "dark-roast", quantity: 2 },
      ]),
    ).toBe(false);
    expect(shop.canFulfill([{ productId: "missing", quantity: 1 }])).toBe(
      false,
    );
    expect(shop.canFulfill([{ productId: "dark-roast", quantity: -1 }])).toBe(
      false,
    );
    expect(shop.canFulfill([])).toBe(false);
    expect(shop.inventory["dark-roast"]).toBe(3);
  });
});
