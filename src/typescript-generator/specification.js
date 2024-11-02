import nodePath from "node:path";

import createDebug from "debug";
import { Requirement } from "./requirement.js";
import { bundle } from "@apidevtools/json-schema-ref-parser";

const debug = createDebug("counterfact:typescript-generator:specification");

export class Specification {
  constructor(rootRequirement) {
    this.cache = new Map();
    this.rootUrl = rootRequirement;
    this.rootRequirement = rootRequirement;
  }

  static async fromFile(urlOrPath) {
    const specification = new Specification();
    await specification.load(urlOrPath);
    return specification;
  }

  getRequirement(url) {
    debug("getting requirement at %s", url);

    return this.rootRequirement.select(url.slice(2));
  }

  async load(urlOrPath) {
    this.rootRequirement = new Requirement(
      await bundle(urlOrPath),
      urlOrPath,
      this,
    );
  }
}
