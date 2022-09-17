import nodePath from "node:path";

import yaml from "js-yaml";

import { readFile } from "../read-file.js";

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

  async loadFile(urlOrPath) {
    if (this.cache.has(urlOrPath)) {
      return this.cache.get(urlOrPath);
    }

    const source = await readFile(urlOrPath, "utf8");

    const data = await yaml.load(source);

    this.cache.set(urlOrPath, data);

    return data;
  }
}
