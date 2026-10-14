type Purchase = {
  items: { productId: string; quantity: number }[];
  status: number | undefined;
  response: unknown;
  before: Record<string, number>;
  after?: Record<string, number>;
};

/** Records API evidence; it never infers that a particular line executed. */
export class CoffeeShopObservations {
  latest: Purchase | undefined;

  order(
    items: Purchase["items"],
    status: Purchase["status"],
    response: unknown,
    before: Record<string, number>,
  ) {
    this.latest = {
      items: items.map((item) => ({ ...item })),
      status,
      response,
      before: { ...before },
    };
  }

  inventory(stock: Record<string, number>) {
    if (this.latest && !this.latest.after) this.latest.after = { ...stock };
  }

  comparisons() {
    if (!this.latest) return [];
    const quantities: Record<string, number> = {};
    for (const item of this.latest.items) {
      quantities[item.productId] =
        (quantities[item.productId] || 0) + item.quantity;
    }
    return Object.entries(quantities).map(([productId, quantity]) => ({
      productId,
      quantity,
      before: this.latest!.before[productId],
      after: this.latest!.after?.[productId],
      accepted: this.latest!.status === 201,
    }));
  }
}
