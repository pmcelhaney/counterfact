export function coffeeShopAction({
  step,
  done,
  cart,
  stock,
  ordered,
  manualStage,
  inventoryUpdated,
}: {
  step: number;
  done: boolean;
  cart: Record<string, number>;
  stock: Record<string, number>;
  ordered: boolean;
  manualStage: number;
  inventoryUpdated: boolean;
}): { text: string; confirm?: string } | undefined {
  if (done || step === 11) return;
  if (step === 0) return { text: "Click Start shopping" };
  const edits: Record<number, [string, string][]> = {
    2: [
      ["Open routes/products.ts in your editor", "File is open"],
      ["Change its starting stock from 0 to 5", "I've made the change"],
      ["save", "I've saved the file"],
    ],
    4: [
      ["Open routes/orders.ts", "File is open"],
      ["change ordersAvailable to false", "I've made the change"],
      ["save", "I've saved the file"],
    ],
    5: [
      ["restore ordersAvailable to true", "I've made the change"],
      ["save", "I've saved the file"],
    ],
    7: inventoryUpdated
      ? []
      : [
          [
            "Open routes/_.context.ts to see inventory",
            "I've inspected the inventory",
          ],
          ["open routes/orders.ts", "File is open"],
          [
            "Add these lines at the INVENTORY LESSON comment",
            "I've added the lines",
          ],
          ["save", "I've saved the file"],
        ],
    9: [
      ["Switch to Counterfact’s terminal", "I'm at the REPL"],
      [
        "Inspect the inventory with the first command",
        "I've inspected the inventory",
      ],
      ["Restock it with the second command", "I've run the command"],
    ],
  };
  if (step === 4 && !Object.keys(cart).length)
    return { text: "Add a coffee to your cart" };
  const edit = edits[step]?.[manualStage];
  if (edit && !ordered) return { text: edit[0], confirm: edit[1] };
  if (step === 2 || step === 9 || ordered) return { text: "refresh products" };
  if (step === 5) return { text: "Click Try again" };
  if (step === 4) return { text: "click Place order" };
  const product =
    step === 1 ? "house-blend" : step === 3 ? "decaf" : "dark-roast";
  const quantity = step === 8 ? stock[product] || 1 : 1;
  if ((cart[product] || 0) < quantity) {
    return {
      text:
        step === 1
          ? "Add House Blend to your cart"
          : step === 3
            ? "Add Decaf to the cart"
            : step === 8
              ? "Add the remaining Dark Roast bags to your cart"
              : "Add one Dark Roast to your cart",
    };
  }
  return { text: "place an order" };
}
