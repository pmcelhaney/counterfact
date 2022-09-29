import nodePath from "node:path";

import { Coder } from "./coder.js";

export class ContextCoder extends Coder {
  pathString() {
    return this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/")
      .replaceAll("~0", "~");
  }

  names() {
    return super.names("Context");
  }

  write(script) {
    if (script.path === "paths/$context.ts") {
      return "{}";
    }

    const parentPath = nodePath.normalize(
      nodePath.join(script.path, "../../$context.ts")
    );

    script.repository.get(parentPath).exportDefault(this);

    return { raw: 'export { default } from "../$context.js"' };
  }

  modulePath() {
    return nodePath.join(
      "paths",
      nodePath.dirname(this.pathString()),
      "$context.ts"
    );
  }
}
