import { expect, it } from "@jest/globals";
import { CoffeeShopObservations } from "../../src/cli/coffee-shop-observations.js";

it("compares actual before and after responses without predicting a decrement", () => {
  const observations = new CoffeeShopObservations();
  const before = { "dark-roast": 3 };
  observations.order(
    [{ productId: "dark-roast", quantity: 1 }],
    201,
    { orderId: 1 },
    before,
  );
  before["dark-roast"] = 99;
  expect(observations.comparisons()[0]?.after).toBeUndefined();
  observations.inventory({ "dark-roast": 3 });
  expect(observations.comparisons()[0]).toEqual({
    productId: "dark-roast",
    quantity: 1,
    before: 3,
    after: 3,
    accepted: true,
  });
  observations.order(
    [{ productId: "dark-roast", quantity: 1 }],
    201,
    { orderId: 2 },
    { "dark-roast": 3 },
  );
  observations.inventory({ "dark-roast": 2 });
  expect(observations.comparisons()[0]?.after).toBe(2);
});

it("records rejected and unconfirmed orders without inventing success", () => {
  const observations = new CoffeeShopObservations();
  observations.order(
    [{ productId: "dark-roast", quantity: 1 }],
    409,
    { error: "Sold out" },
    { "dark-roast": 0 },
  );
  observations.inventory({ "dark-roast": 0 });
  expect(observations.comparisons()[0]?.accepted).toBe(false);
  observations.order(
    [{ productId: "dark-roast", quantity: 1 }],
    undefined,
    undefined,
    { "dark-roast": 0 },
  );
  expect(observations.latest?.status).toBeUndefined();
  expect(observations.comparisons()[0]?.after).toBeUndefined();
});
