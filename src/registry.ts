import type { Endpoint } from "./endpoint";
import type { EndpointModule } from "./endpoint-module";
import type { RequestMethod } from "./request-method";

export class Registry {
  private modules: {
    [key: string]: EndpointModule | undefined;
  } = {};

  public state: { [key: string]: unknown };

  public constructor(state = {}) {
    this.state = state;
  }

  public get modulesList(): readonly string[] {
    return Object.keys(this.modules);
  }

  public add(path: string, script: Readonly<EndpointModule>) {
    this.modules[path] = script;
  }

  public exists(method: RequestMethod, path: string): boolean {
    return Boolean(this.modules[path]?.[method]);
  }

  public endpoint(method: RequestMethod, path: string): Endpoint {
    const module = this.modules[path];
    const lambda = module?.[method];
    if (!lambda) {
      throw new Error(
        `${method} method for endpoint at "${path}" does not exist`
      );
    }
    return lambda;
  }
}
