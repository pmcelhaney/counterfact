interface Response {
  body: string;
}

// eslint-disable-next-line etc/prefer-interface
type Endpoint = () => Response;

interface Script {
  GET?: () => Response;
  POST?: () => Response;
  PUT?: () => Response;
  DELETE?: () => Response;
}

type RequestMethod = "DELETE" | "GET" | "POST" | "PUT";

export class ScriptedServer {
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
    return () => ({ body: "not found" });
  }
}
