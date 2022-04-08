import type { Server } from "./server";
import type { CounterfactResponse } from "./counterfact-response";
import type { CounterfactRequest } from "./counterfact-request";

export class Dispatcher {
  private readonly server: Server;

  public constructor(server: Readonly<Server>) {
    this.server = server;
  }

  public request({
    method,
    path,
  }: Readonly<CounterfactRequest>): CounterfactResponse {
    const endpoint = this.server.endpoint(method, path);
    return endpoint();
  }
}
