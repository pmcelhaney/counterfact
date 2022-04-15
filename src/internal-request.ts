interface State {
  [key: string]: unknown;
}

export interface InternalRequest {
  path: string;
  reduce: (reducer: (state: Readonly<State>) => State) => void;
}
