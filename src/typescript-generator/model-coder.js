import nodePath from "node:path";

import { Coder } from "./coder.js";

export class ModelCoder extends Coder {
  names() {
    return super.names("Model");
  }

  write() {
    return "class {}";
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${nodePath.join("paths", nodePath.dirname(pathString))}/#model.ts`;
  }
}
