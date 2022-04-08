import type { Server } from "./server";
import type { Endpoint } from "./endpoint";
import type { RequestMethod } from "./request-method";

interface Script {
  GET?: Endpoint;
  POST?: Endpoint;
  PUT?: Endpoint;
  DELETE?: Endpoint;
}

export class ScriptedServer implements Server {
  private scripts: { [key: string]: Script | undefined } = {};

  public add(path: string, script: Readonly<Script>) {
    this.scripts[path] = script;
  }

  public exists(path: string) {
    return path in this.scripts;
  }

  public endpoint(method: RequestMethod, path: string): Endpoint {
    const script = this.scripts[path];
    const lambda = script?.[method];
    if (lambda) {
      return lambda;
    }
    return () => ({ body: `not found (${method} ${path}}` });
  }
}
