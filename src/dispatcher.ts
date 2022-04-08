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
    const parts = path.split("/");

    let remainingParts = parts.length;

    while (remainingParts > 0) {
      const currentPath = parts.slice(0, remainingParts).join("/");

      if (this.server.exists(method, currentPath)) {
        return this.server.endpoint(
          method,
          currentPath
        )({ path: parts.slice(remainingParts).join("/") });
      }

      remainingParts -= 1;
    }

    return {
      body: "not found",
    };
  }
}
