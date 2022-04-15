interface State {
  [key: string]: unknown;
}

export interface InternalRequest {
  path: string;
  reduce: (reducer: (store: Readonly<State>) => State) => void;
  store: any;
}
