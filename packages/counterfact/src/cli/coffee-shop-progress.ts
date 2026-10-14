export class CoffeeShopProgress {
  step = 0;
  done = false;
  inventoryUpdated = false;
  lastOrder:
    | { items: { productId: string; quantity: number }[]; stock: number }
    | undefined;
  failedItems: string | undefined;

  next() {
    if (!this.done && this.step !== 0) return;
    this.step = Math.min(11, this.step + 1);
    this.done = false;
    this.lastOrder = undefined;
  }

  skip() {
    this.step = Math.min(11, this.step + 1);
    this.done = false;
    this.lastOrder = undefined;
  }

  back() {
    this.step = Math.max(0, this.step - 1);
    this.done = false;
    this.lastOrder = undefined;
  }

  order(
    success: boolean,
    items: { productId: string; quantity: number }[],
    stock: number,
    status: number,
  ) {
    if (this.done) return;
    if (
      this.step === 1 &&
      success &&
      items.some((item) => item.productId === "house-blend")
    )
      this.done = true;
    if (
      this.step === 3 &&
      success &&
      items.some((item) => item.productId === "decaf")
    )
      this.done = true;
    if (this.step === 4 && !success && status === 503) {
      this.failedItems = JSON.stringify(items);
      this.done = true;
    }
    if (
      this.step === 5 &&
      success &&
      JSON.stringify(items) === this.failedItems
    )
      this.done = true;
    if (
      [6, 7, 8, 10].includes(this.step) &&
      success &&
      items.some((item) => item.productId === "dark-roast")
    ) {
      if (this.lastOrder && this.lastOrder.stock === stock) {
        this.lastOrder.items.push(...items);
      } else {
        this.lastOrder = { items: items.map((item) => ({ ...item })), stock };
      }
    }
  }

  products(stock: Record<string, number>) {
    if (this.done) return;
    if (this.step === 2 && stock["decaf"] === 5) this.done = true;
    if (this.step === 9 && stock["dark-roast"] === 5) this.done = true;
    if (this.step === 8 && this.inventoryUpdated && stock["dark-roast"] === 0)
      this.done = true;
    if (!this.lastOrder) return;
    const quantity = this.lastOrder.items
      .filter((item) => item.productId === "dark-roast")
      .reduce((total, item) => total + item.quantity, 0);
    if (this.step === 6 && stock["dark-roast"] === this.lastOrder.stock)
      this.done = true;
    if (
      this.step === 7 &&
      this.lastOrder.stock > 0 &&
      stock["dark-roast"] === this.lastOrder.stock - quantity
    ) {
      this.done = true;
      this.inventoryUpdated = true;
    }
    if (
      this.step === 8 &&
      this.lastOrder.stock === quantity &&
      stock["dark-roast"] === 0
    )
      this.done = true;
    if (
      this.step === 10 &&
      this.lastOrder.stock === 5 &&
      quantity === 1 &&
      stock["dark-roast"] === 4
    )
      this.done = true;
  }
}
