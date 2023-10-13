import nodePath from "node:path";

import { Coder } from "./coder.js";

export class ContextTypeCoder extends Coder {
  constructor(requirement, isRoot) {
    super(requirement);
    this.isRoot = isRoot;
  }

  pathString() {
    return this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/")
      .replaceAll("~0", "~");
  }

  get id() {
    return "ContextTypeCoder";
  }

  names() {
    return super.names("ContextType");
  }

  write(script) {
    if (script.path === "paths/$.context.ts") {
      return "typeof Context";
    }

    return { raw: 'export type { ContextType } from "../$.context"' };
  }

  modulePath() {
    return nodePath
      .join("paths", nodePath.dirname(this.pathString()), "$.context.ts")
      .replaceAll("\\", "/");
  }
}
