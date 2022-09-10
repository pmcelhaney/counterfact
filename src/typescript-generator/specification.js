import fs from "node:fs/promises";
import nodePath from "node:path";

import yaml from "js-yaml";

import { Requirement } from "./requirement.js";

export class Specification {
  constructor() {
    this.cache = new Map();
  }

  async requirementAt(url, fromUrl = "") {
    const [file, path] = url.split("#");

    const filePath = nodePath.join(fromUrl.split("#").at(0), file);
    const data = await this.loadFile(filePath);

    const rootRequirement = new Requirement(data, `${filePath}#`, this);

    return rootRequirement.select(path.slice(1));
  }

  async loadFile(url) {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }

    const source = await fs.readFile(url, "utf8");

    const data = await yaml.load(source);

    this.cache.set(url, data);

    return data;
  }
}
