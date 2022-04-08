interface Script {
  GET?: () => { body: string };
  POST?: () => { body: string };
  PUT?: () => { body: string };
  DELETE?: () => { body: string };
}

export class Importer {
  private scripts: { [key: string]: Script } = {};

  public add(path: string, script: Readonly<Script>) {
    this.scripts[path] = script;
  }

  public exists(path: string) {
    return path in this.scripts;
  }

  public get(path: string) {
    return this.scripts[path].GET;
  }
}
