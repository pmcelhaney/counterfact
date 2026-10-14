import { expect, it } from "@jest/globals";
import { coffeeShopAction } from "../../src/cli/coffee-shop-action.js";

const state = {
  step: 8,
  done: false,
  cart: {},
  stock: { "dark-roast": 3 },
  ordered: false,
  manualStage: 0,
  inventoryUpdated: true,
};

it("moves from adding all remaining bags to ordering, then refreshing", () => {
  expect(coffeeShopAction(state)?.text).toBe(
    "Add the remaining Dark Roast bags to your cart",
  );
  expect(coffeeShopAction({ ...state, cart: { "dark-roast": 2 } })?.text).toBe(
    "Add the remaining Dark Roast bags to your cart",
  );
  expect(coffeeShopAction({ ...state, cart: { "dark-roast": 3 } })?.text).toBe(
    "place an order",
  );
  expect(coffeeShopAction({ ...state, ordered: true })?.text).toBe(
    "watch the inventory",
  );
  expect(coffeeShopAction({ ...state, done: true })).toBeUndefined();
});

it("returns to adding bags if the user reduces the cart before ordering", () => {
  expect(coffeeShopAction({ ...state, cart: { "dark-roast": 3 } })?.text).toBe(
    "place an order",
  );
  expect(coffeeShopAction({ ...state, cart: { "dark-roast": 2 } })?.text).toBe(
    "Add the remaining Dark Roast bags to your cart",
  );
});

it("confirms editor actions separately and still requires a product refresh", () => {
  const edit = { ...state, step: 2 };
  expect(coffeeShopAction(edit)).toEqual({
    text: "Open routes/products.ts in your editor",
    confirm: "File is open",
  });
  expect(coffeeShopAction({ ...edit, manualStage: 1 })?.text).toBe(
    "Change its starting stock from 0 to 5",
  );
  expect(coffeeShopAction({ ...edit, manualStage: 2 })?.text).toBe("save");
  expect(coffeeShopAction({ ...edit, manualStage: 3 })).toEqual({
    text: "watch the inventory",
  });
});

it("keeps failed orders at the ordering action and skips retained inventory edits", () => {
  expect(
    coffeeShopAction({ ...state, cart: { "dark-roast": 3 }, ordered: false })
      ?.text,
  ).toBe("place an order");
  expect(coffeeShopAction({ ...state, step: 7 })?.text).toBe(
    "Add one Dark Roast to your cart",
  );
  expect(
    coffeeShopAction({ ...state, step: 7, inventoryUpdated: false })?.confirm,
  ).toBe("I've inspected the inventory");
});
