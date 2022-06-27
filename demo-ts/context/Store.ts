// This file will be maintained by hand.

type Visits = { [name: string]: number }

export class Store {
    visits: Visits = {};
}


// Counterfact will load this object and use it as the initial state.
export const store = new Store();