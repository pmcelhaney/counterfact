type Observation = {
  kind: "order" | "inventory";
  id: number;
  time: number;
  items: { productId: string; quantity: number }[];
  status: number | undefined;
  response: unknown;
  before: Record<string, number>;
  after?: Record<string, number>;
};

/** Records API evidence; it never infers that a particular line executed. */
export class CoffeeShopObservations {
  latest: Observation | undefined;
  events: Observation[] = [];
  private sequence = 0;
  private observedStock: Record<string, number> | undefined;

  private add(event: Omit<Observation, "id" | "time">) {
    const entry = { ...event, id: ++this.sequence, time: Date.now() };
    this.events.push(entry);
    this.events = this.events.slice(-30);
    return entry;
  }

  order(
    items: Observation["items"],
    status: Observation["status"],
    response: unknown,
    before: Record<string, number>,
  ) {
    this.latest = this.add({
      kind: "order",
      items: items.map((item) => ({ ...item })),
      status,
      response,
      before: { ...before },
    });
  }

  inventory(stock: Record<string, number>, response: unknown = stock) {
    if (this.latest && !this.latest.after) this.latest.after = { ...stock };
    else if (
      this.observedStock &&
      Object.keys(stock).some((id) => stock[id] !== this.observedStock![id])
    ) {
      this.add({
        kind: "inventory",
        items: [],
        status: 200,
        response,
        before: { ...this.observedStock },
        after: { ...stock },
      });
    }
    this.observedStock = { ...stock };
  }

  comparisons(event = this.latest) {
    if (!event) return [];
    const quantities: Record<string, number> = {};
    if (event.kind === "inventory") {
      for (const id of Object.keys(event.after || {})) {
        if (event.before[id] !== event.after?.[id]) quantities[id] = 0;
      }
    } else
      for (const item of event.items) {
        quantities[item.productId] =
          (quantities[item.productId] || 0) + item.quantity;
      }
    return Object.entries(quantities).map(([productId, quantity]) => ({
      productId,
      quantity,
      before: event.before[productId],
      after: event.after?.[productId],
      accepted: event.status === 201,
    }));
  }

  restore(saved: unknown) {
    if (!Array.isArray(saved) || saved.length > 30) return;
    const ids = ["house-blend", "dark-roast", "decaf"];
    const stock = (value: unknown) =>
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(value).every(
        ([id, count]) =>
          ids.includes(id) && Number.isSafeInteger(count) && count >= 0,
      );
    try {
      if (JSON.stringify(saved).length > 100_000) return;
      if (
        !saved.every(
          (event) =>
            event &&
            ["order", "inventory"].includes(event.kind) &&
            Number.isSafeInteger(event.id) &&
            event.id > 0 &&
            Number.isFinite(event.time) &&
            stock(event.before) &&
            (event.after === undefined || stock(event.after)) &&
            (event.status === undefined ||
              (Number.isInteger(event.status) &&
                event.status >= 100 &&
                event.status <= 599)) &&
            Array.isArray(event.items) &&
            event.items.length <= 20 &&
            event.items.every(
              (item: { productId: string; quantity: number }) =>
                item &&
                ids.includes(item.productId) &&
                Number.isSafeInteger(item.quantity) &&
                item.quantity > 0,
            ),
        )
      )
        return;
      this.events = JSON.parse(JSON.stringify(saved)) as Observation[];
      this.sequence = Math.max(0, ...this.events.map((event) => event.id));
      this.latest = this.events
        .filter((event) => event.kind === "order")
        .at(-1);
      const last = this.events.at(-1);
      this.observedStock = last
        ? { ...(last.after || last.before) }
        : undefined;
    } catch {
      /* Invalid or oversized saved history is discarded. */
    }
  }
}
