import nodePath from "node:path";

import { Coder } from "./coder.js";
import type { Requirement } from "./requirement.js";

export class ContextCoder extends Coder {
  private readonly requirement: Requirement;

  public pathString() {
    return this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/")
      .replaceAll("~0", "~");
  }

  // eslint-disable-next-line @typescript-eslint/class-literal-property-style
  public get id() {
    return "ContextCoder";
  }

  public names() {
    return super.names("Context");
  }

  public beforeExport(path) {
    return `/**
* This is the default context for Counterfact.
* Change the code to suit your needs.
*/
class Context {
  // delete this line to make the class type safe
  [key: string]: any; 

  // A helper when you accessing the context object via the REPL. You can delete it if you like.
  [Symbol.for('nodejs.util.inspect.custom')](depth, options, inspect) {
    return inspect(this, { ...options, customInspect: false }) + "\\n\\n ^ This is the default context object. You can edit its definition at ${path}";
  }
}
`;
  }

  public write(script) {
    if (script.path === "paths/$.context.ts") {
      return "new Context()";
    }

    const parentPath = nodePath.normalize(
      nodePath.join(script.path, "../../$.context.ts")
    );

    script.repository.get(parentPath).exportDefault(this);

    return { raw: 'export { default } from "../$.context.js"' };
  }

  public modulePath() {
    return nodePath.join(
      "paths",
      nodePath.dirname(this.pathString()),
      "$.context.ts"
    );
  }
}
