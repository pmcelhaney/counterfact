// This file will be maintained by hand.

interface Visits {
  [name: string]: number;
}

export class Context {
  public visits: Visits = {};

  public lastVisited = "";

  public visit(page: string) {
    this.lastVisited = page;
    this.visits[page] = (this.visits[page] || 0) + 1;
  }
}

// Counterfact will load this object and use it as the initial state.
export const context = new Context();
