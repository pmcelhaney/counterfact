import nodePath from "node:path";

import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import { Requirement } from "./requirement.js";

export class Specification {
  constructor(rootUrl) {
    this.cache = new Map();
    this.rootUrl = rootUrl;
  }

  async requirementAt(url, fromUrl = "") {
    const [file, path] = url.split("#");

    const filePath = nodePath.join(fromUrl.split("#").at(0), file);

    const fileUrl = filePath === "." ? this.rootUrl : filePath;
    const data = await this.loadFile(fileUrl);

    const rootRequirement = new Requirement(data, `${fileUrl}#`, this);

    return rootRequirement.select(path.slice(1));
  }

  async loadFile(urlOrPath) {
    if (this.cache.has(urlOrPath)) {
      return this.cache.get(urlOrPath);
    }

    const source = await readFile(urlOrPath, "utf8");

    const data = await yaml.load(source);

    this.cache.set(urlOrPath, data);

    this.rootRequirement = new Requirement(data, `${urlOrPath}#`, this);

    return data;
  }
}
