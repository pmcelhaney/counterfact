import type { Server } from "./server";
import type { CounterfactResponse } from "./counterfact-response";
import type { CounterfactRequest } from "./counterfact-request";

export class Dispatcher {
  private readonly server: Server;

  public constructor(server: Readonly<Server>) {
    this.server = server;
  }

  public async request({
    method,
    path,
  }: Readonly<CounterfactRequest>): Promise<CounterfactResponse> {
    const parts = path.split("/");

    let remainingParts = parts.length;
    let currentPath = "";

    while (remainingParts > 0) {
      currentPath = parts.slice(0, remainingParts).join("/");

      if (this.server.exists(method, currentPath)) {
        break;
      }

      remainingParts -= 1;
    }

    return await this.server.endpoint(
      method,
      currentPath
    )({
      path: parts.slice(remainingParts).join("/"),
    });
  }
}
