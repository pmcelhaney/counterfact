import type { CounterfactResponse } from "./counterfact-response";
import type { InternalRequest } from "./internal-request";

// eslint-disable-next-line etc/prefer-interface
export type Endpoint = (
  req: Readonly<InternalRequest>
) => CounterfactResponse | Promise<CounterfactResponse>;
