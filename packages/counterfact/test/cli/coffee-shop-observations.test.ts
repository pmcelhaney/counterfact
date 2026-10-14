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

it("retains past purchase comparisons when external inventory changes", () => {
  const observations = new CoffeeShopObservations();
  observations.inventory({ "dark-roast": 3 });
  observations.order(
    [{ productId: "dark-roast", quantity: 1 }],
    201,
    { orderId: 1 },
    { "dark-roast": 3 },
  );
  observations.inventory({ "dark-roast": 2 });
  observations.inventory({ "dark-roast": 5 });
  expect(observations.events.map((event) => event.kind)).toEqual([
    "order",
    "inventory",
  ]);
  expect(observations.comparisons(observations.events[0])[0]?.after).toBe(2);
  expect(observations.comparisons(observations.events[1])[0]?.after).toBe(5);
});

it("bounds and restores history without trusting corrupt session data", () => {
  const observations = new CoffeeShopObservations();
  for (let order = 0; order < 35; order += 1) {
    observations.order(
      [{ productId: "dark-roast", quantity: 1 }],
      201,
      { orderId: order },
      { "dark-roast": 5 },
    );
    observations.inventory({ "dark-roast": 4 });
  }
  expect(observations.events).toHaveLength(30);
  const restored = new CoffeeShopObservations();
  restored.restore(JSON.parse(JSON.stringify(observations.events)));
  expect(restored.events).toEqual(observations.events);
  expect(restored.latest?.id).toBe(35);
  restored.restore([
    { ...observations.events[0], before: { "dark-roast": -1 } },
  ]);
  expect(restored.events).toHaveLength(30);
  restored.order(
    [{ productId: "dark-roast", quantity: 1 }],
    409,
    { error: "Rejected" },
    { "dark-roast": 0 },
  );
  expect(restored.latest?.id).toBe(36);
});
