import { coffeeShopPage } from "./coffee-shop-page.js";

const item = {
  type: "object",
  required: ["productId", "quantity"],
  properties: {
    productId: { type: "string", enum: ["house-blend", "dark-roast", "decaf"] },
    quantity: { type: "integer", minimum: 1 },
  },
};
const jsonResponse = (schema: object) => ({
  description: "Coffee shop response",
  content: { "application/json": { schema } },
});
const errorResponse = jsonResponse({
  type: "object",
  required: ["error"],
  properties: { error: { type: "string" } },
});
export const SHOP_DOCUMENT = {
  openapi: "3.0.3",
  info: { title: "Counterfact Coffee", version: "1.0.0" },
  paths: {
    "/products": {
      get: {
        responses: {
          "200": jsonResponse({
            type: "array",
            items: {
              type: "object",
              required: ["id", "name", "description", "price", "stock"],
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                description: { type: "string" },
                price: { type: "integer" },
                stock: { type: "integer", minimum: 0 },
              },
            },
          }),
        },
      },
    },
    "/orders": {
      post: {
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["items"],
                properties: {
                  items: { type: "array", minItems: 1, items: item },
                },
              },
            },
          },
        },
        responses: {
          "201": jsonResponse({
            type: "object",
            required: ["orderId", "items"],
            properties: {
              orderId: { type: "integer" },
              items: { type: "array", items: item },
            },
          }),
          "409": errorResponse,
          "503": errorResponse,
        },
      },
    },
    "/walkthrough": {
      get: {
        responses: {
          "200": {
            description: "Guided coffee shop",
            content: { "text/html": { schema: { type: "string" } } },
          },
        },
      },
    },
  },
};

export const SHOP_CONTEXT = `export class Context {
  inventory: Record<string, number> = {};
  nextOrderId = 1;
  private decafSetting = 0;

  setDecafStock(quantity: number) {
    // Apply an edited starting quantity once; later purchases keep their changes.
    if (quantity !== this.decafSetting) {
      this.inventory["decaf"] = quantity;
      this.decafSetting = quantity;
    }
  }

  canFulfill(items: { productId: string; quantity: number }[]) {
    const quantities: Record<string, number> = {};
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) return false;
      quantities[item.productId] = (quantities[item.productId] ?? 0) + item.quantity;
    }
    return items.length > 0 && Object.entries(quantities).every(
      ([id, quantity]) => quantity <= (this.inventory[id] ?? 0),
    );
  }
}
`;

export const SHOP_PRODUCTS = `import type { HTTP_GET } from "../types/paths/products.types.js";

// Lesson: change Decaf's starting stock from 0 to 5, then save and refresh.
const decafStock = 0;

export const GET: HTTP_GET = ($) => {
  $.context.setDecafStock(decafStock);
  return $.response[200].json([
    { id: "house-blend", name: "House Blend", description: "Chocolate, caramel, and a gentle finish.", price: 1400, stock: $.context.inventory["house-blend"] },
    { id: "dark-roast", name: "Dark Roast", description: "Rich cocoa with a bold, toasted finish.", price: 1600, stock: $.context.inventory["dark-roast"] },
    { id: "decaf", name: "Decaf", description: "All the comfort of coffee. An easier evening.", price: 1500, stock: $.context.inventory["decaf"] },
  ]);
};
`;

export const SHOP_ORDERS = `import type { HTTP_POST } from "../types/paths/orders.types.js";

// Lesson: set this to false to try the shop's error and retry behavior.
const ordersAvailable = true;

export const POST: HTTP_POST = ($) => {
  if (!ordersAvailable) {
    return $.response[503].json({ error: "Ordering is temporarily unavailable." });
  }
  const items = $.body.items;
  if (!$.context.canFulfill(items)) {
    return $.response[409].json({ error: "There isn't enough stock for this order. Refresh products and check your cart." });
  }

  // INVENTORY LESSON: subtract each purchased quantity here.

  return $.response[201].json({ orderId: $.context.nextOrderId++, items });
};
`;

export function coffeeShopFiles(projectPath: string): Record<string, string> {
  return {
    "routes/_.context.ts": SHOP_CONTEXT,
    "routes/products.ts": SHOP_PRODUCTS,
    "routes/orders.ts": SHOP_ORDERS,
    "scenarios/index.ts": `import type { Scenario } from "../types/_.context.js";

// A deliberately small catalog makes availability and selling out easy to see.
export const startup: Scenario = ($) => {
  $.context.inventory = { "house-blend": 5, "dark-roast": 3, "decaf": 0 };
};
`,
    "routes/walkthrough.ts": `import type { HTTP_GET } from "../types/paths/walkthrough.types.js";

export const GET: HTTP_GET = ($) => $.response[200].html(${JSON.stringify(coffeeShopPage(projectPath))});
`,
  };
}
