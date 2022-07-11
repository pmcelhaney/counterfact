import prettier from "prettier";

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
    while (
      Array.from(this.scripts.values()).some((script) => script.isInProgress())
    ) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        Array.from(this.scripts.values(), (script) => script.finished())
      );
    }

    // now everything is settled and we can write the files
    await Array.from(this.scripts.entries()).forEach(async ([key, script]) => {
      await script.finished();

      console.log("~~~~~~~~~~~~~~~~~~~~~~");
      console.log(`${key}:`);

      console.log(prettier.format(script.contents(), { parser: "typescript" }));
      console.log("~~~~~~~~~~~~~~~~~~~~~~");
    });
  }
}
