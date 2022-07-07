import { Script } from "./script.js";

export class Repository {
  constructor() {
    this.scripts = new Map();
  }

  get(path) {
    if (this.scripts.has(path)) {
      return this.scripts.get(path);
    }

    const script = new Script(this, path);

    this.scripts.set(path, script);

    return script;
  }

  async writeFiles() {
    while (this.scripts.values().some((script) => script.isInProgress())) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        this.scripts.values().map((script) => script.finished())
      );
    }

    // now everything is settled and we can write the files
  }
}
