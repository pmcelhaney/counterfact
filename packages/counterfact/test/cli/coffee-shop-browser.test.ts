import vm from "node:vm";
import { expect, it } from "@jest/globals";
import { coffeeShopPage } from "../../src/cli/coffee-shop-page.js";

// A small DOM and controlled HTTP responses exercise the shipped browser script,
// including async refreshes. Real-browser layout is checked separately.
class Element {
  id = "";
  className = "";
  dataset: Record<string, string> = {};
  disabled = false;
  hidden = false;
  children: Element[] = [];
  parent: Element | undefined;
  onclick: (() => unknown) | undefined;
  private text = "";
  constructor(readonly tag: string) {}
  set textContent(text: string) {
    this.text = text;
    this.children = [];
  }
  get textContent(): string {
    return this.text + this.children.map((child) => child.textContent).join("");
  }
  append(...children: Element[]) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }
  replaceChildren(...children: Element[]) {
    this.text = "";
    this.children = [];
    this.append(...children);
  }
  setAttribute(name: string, value: string) {
    if (name === "id") this.id = value;
  }
  replaceWith(node: Element) {
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    this.parent.children[index] = node;
    node.parent = this.parent;
  }
  remove() {
    if (this.parent)
      this.parent.children = this.parent.children.filter(
        (child) => child !== this,
      );
  }
}
function find(
  node: Element,
  predicate: (node: Element) => boolean,
): Element | undefined {
  if (predicate(node)) return node;
  for (const child of node.children) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return undefined;
}
async function browser(
  storage = new Map<string, string>(),
  stocks = { "house-blend": 5, "dark-roast": 3, decaf: 0 },
) {
  const page = coffeeShopPage("/tmp/coffee-shop");
  const roots = [...page.split("<script>")[0]!.matchAll(/id="([^"]+)"/gu)].map(
    (match) => {
      const node = new Element("div");
      node.id = match[1]!;
      return node;
    },
  );
  const root = (id: string) =>
    roots.map((node) => find(node, (node) => node.id === id)).find(Boolean)!;
  const server = { productMode: "valid", orderMode: "accepted", deduct: false };
  const calls: string[] = [];
  let poll: (() => void) | undefined;
  const products = () => [
    {
      id: "house-blend",
      name: "House Blend",
      description: "Coffee",
      price: 1400,
      stock: stocks["house-blend"],
    },
    {
      id: "dark-roast",
      name: "Dark Roast",
      description: "Coffee",
      price: 1600,
      stock: stocks["dark-roast"],
    },
    {
      id: "decaf",
      name: "Decaf",
      description: "Coffee",
      price: 1500,
      stock: stocks.decaf,
    },
  ];
  const context = vm.createContext({
    document: {
      hidden: false,
      createElement: (tag: string) => new Element(tag),
      getElementById: root,
    },
    window: { addEventListener: () => undefined },
    navigator: {},
    AbortController,
    setTimeout,
    clearTimeout,
    setInterval: (callback: () => void) => {
      poll = callback;
      return 1;
    },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    fetch: async (path: string, options: { body?: string } = {}) => {
      calls.push(path);
      let status = 200;
      let result: unknown;
      if (path === "/tutorial-info") result = { sessionId: "same-api-session" };
      else if (path === "/products") {
        if (server.productMode === "offline") throw Error("Disconnected");
        result =
          server.productMode === "invalid"
            ? [{ id: "house-blend" }]
            : products();
      } else {
        if (server.orderMode === "offline") throw Error("No confirmation");
        const items = (
          JSON.parse(options.body!) as {
            items: { productId: keyof typeof stocks; quantity: number }[];
          }
        ).items;
        status = server.orderMode === "shortage" ? 409 : 201;
        result =
          status === 409
            ? {
                error: "Not enough stock",
                shortages: items.map((item) => ({
                  productId: item.productId,
                  requested: item.quantity,
                  available: stocks[item.productId],
                })),
              }
            : { orderId: 1 };
        if (status === 201 && server.deduct)
          for (const item of items) stocks[item.productId] -= item.quantity;
      }
      return { status, ok: status < 400, json: async () => result };
    },
  });
  const read = <T = unknown>(code: string): T =>
    vm.runInContext(code, context) as T;
  vm.runInContext(page.split("<script>")[1]!.split("</script>")[0]!, context);
  await read<Promise<void>>("walkthroughReady");
  return {
    server,
    stocks,
    calls,
    root,
    read,
    storage,
    add(id = "house-blend") {
      const card = find(
        root("products"),
        (node) => node.dataset.productId === id,
      )!;
      find(card, (node) => node.tag === "button")!.onclick!();
    },
    order: () => read<Promise<void>>("placeOrder()"),
    async poll() {
      poll!();
      await read<Promise<void>>("refreshRequest");
    },
  };
}

it("shows shopper availability while adding to the cart leaves API inventory unchanged", async () => {
  const app = await browser();
  app.add();
  expect(app.stocks["house-blend"]).toBe(5);
  expect(app.root("products").textContent).toContain("4 bags available");
});

it("automatically compares actual unchanged and decreased inventory after orders", async () => {
  const app = await browser();
  app.add();
  await app.order();
  expect(app.root("purchase-effect").textContent).toContain("inventory 5 → 5");
  expect(app.root("purchase-effect").textContent).toContain("did not change");
  app.server.deduct = true;
  app.add();
  await app.order();
  expect(app.root("purchase-effect").textContent).toContain("inventory 5 → 4");
  expect(app.root("purchase-effect").textContent).toContain("5 − 1 = 4");
  expect(app.calls.filter((path) => path === "/orders")).toHaveLength(2);
});

it("observes a live inventory edit and credits the response without manual refresh", async () => {
  const app = await browser();
  app.read("progress.step=2;showLesson()");
  app.stocks.decaf = 5;
  await app.poll();
  expect(app.read("progress.done")).toBe(true);
  expect(app.root("products").textContent).toContain("Decaf");
  expect(app.root("history").textContent).toContain("Decaf 0 → 5");
});

it("keeps rejected carts and explains server-reported requested and available quantities", async () => {
  const app = await browser();
  app.add();
  app.stocks["house-blend"] = 0;
  app.server.orderMode = "shortage";
  await app.order();
  expect(app.root("shop-notice").textContent).toContain(
    "House Blend: your cart requested 1; the order API reported 0 available",
  );
  expect(app.root("cart").textContent).toContain("House Blend × 1");
  expect(app.root("history").textContent).toContain("Rejected");
});

it.each(["invalid", "offline"])(
  "marks %s product data stale and reconnects without losing the cart",
  async (mode) => {
    const app = await browser();
    app.add();
    app.server.productMode = mode;
    await app.poll();
    expect(app.root("products").textContent).toContain(
      "Availability temporarily unavailable",
    );
    expect(app.root("checkout").disabled).toBe(true);
    expect(app.root("cart").textContent).toContain("House Blend × 1");
    app.server.productMode = "valid";
    await app.poll();
    expect(app.root("checkout").disabled).toBe(false);
    expect(app.root("products").textContent).not.toContain(
      "Availability temporarily unavailable",
    );
  },
);

it("distinguishes an unknown confirmation from rejection and prevents duplicate simultaneous orders", async () => {
  const app = await browser();
  app.add();
  app.server.orderMode = "offline";
  await Promise.all([app.order(), app.order()]);
  expect(app.calls.filter((path) => path === "/orders")).toHaveLength(1);
  expect(app.root("shop-notice").textContent).toContain(
    "may have been accepted",
  );
  expect(app.root("history").textContent).toContain("Unknown");
  expect(app.root("cart").textContent).toContain("House Blend × 1");
});

it("preserves history on reload and lets inspection show an older request without sending it again", async () => {
  const app = await browser();
  app.add();
  await app.order();
  app.server.deduct = true;
  app.add();
  await app.order();
  const restored = await browser(app.storage, app.stocks);
  expect(restored.root("history").textContent).toContain("Purchase #1");
  const firstRow = find(
    restored.root("history"),
    (node) => node.tag === "tr" && node.textContent.includes("Purchase #1"),
  )!;
  find(firstRow, (node) => node.tag === "button")!.onclick!();
  expect(restored.root("history").textContent).toContain('"orderId": 1');
  expect(restored.calls).not.toContain("/orders");
});
