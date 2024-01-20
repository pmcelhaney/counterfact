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
    return super.names("Context");
  }

  write(script) {
    if (script.path === "paths/_.context.ts") {
      return {
        raw: "export class Context {};",
      };
    }

    return {
      raw: 'export { Context } from "../_.context.js"',
    };
  }

  modulePath() {
    return nodePath
      .join("paths", nodePath.dirname(this.pathString()), "_.context.ts")
      .replaceAll("\\", "/");
  }
}
