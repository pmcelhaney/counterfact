import { Script } from "./script.js";

export class Repository {
  constructor() {
    this.scripts = new Map();
  }

  get(path) {
    if (this.scripts.has(path)) {
      return this.scripts.get(path);
    }

    const script = new Script(this);

    this.scripts.set(path, script);

    return script;
  }
}
