import nodePath from "node:path";

import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import { Requirement } from "./requirement.js";

function log(...strings) {
  process.stdout.write(`[specification] ${strings.join("\t")}\n`);
}

export class Specification {
  constructor(rootUrl) {
    this.cache = new Map();
    this.rootUrl = rootUrl;
  }

  // eslint-disable-next-line max-statements
  async requirementAt(url, fromUrl = "") {
    log("requirementAt", url, fromUrl);

    const [file, path] = url.split("#");

    const filePath = nodePath
      .join(fromUrl.split("#").at(0), file)
      .replaceAll("\\", "/");

    log("filePath", filePath);

    const fileUrl = filePath === "." ? this.rootUrl : filePath;

    log("about to load fileUrl", fileUrl);

    const data = await this.loadFile(fileUrl);

    log("finished loading fileUrl", fileUrl);

    const rootRequirement = new Requirement(data, `${fileUrl}#`, this);

    log("looking up requirement at path", path);

    const result = rootRequirement.select(path.slice(1));

    log("got requirement");

    return result;
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
