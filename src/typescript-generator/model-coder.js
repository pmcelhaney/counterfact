import nodePath from "node:path";

import { Coder } from "./coder.js";

export class ModelCoder extends Coder {
  isRoot() {
    return this.requirement.url.split("/").at(-2).split("~1").length === 2;
  }

  names() {
    return super.names("Model");
  }

  write() {
    if (this.isRoot()) {
      return "class Model {}";
    }

    return "class Model {} // should come from parent";
  }

  modulePath() {
    const pathString = this.requirement.url
      .split("/")
      .at(-2)
      .replaceAll("~1", "/");

    return `${nodePath.join("paths", nodePath.dirname(pathString))}/$model.ts`;
  }
}
