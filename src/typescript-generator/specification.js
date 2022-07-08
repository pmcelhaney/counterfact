import fs from "node:fs/promises";
import { join } from "node:path";

import yaml from "js-yaml";

import { Requirement } from "./requirement.js";

export class Specification {
  constructor(basePath) {
    this.basePath = basePath;
    this.cache = new Map();
  }

  async requirementAt(url) {
    const [file, path] = url.split("#");
    const data = await this.loadFile(file);

    const rootRequirement = new Requirement(data, `${file}#`, this);

    return rootRequirement.select(path.slice(1));
  }

  async loadFile(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    if (!this.basePath) {
      throw new Error("Specification was constructed without a base path");
    }

    const source = await fs.readFile(join(this.basePath, path), "utf8");
    const data = await yaml.load(source);

    this.cache.set(path, data);

    return data;
  }
}
