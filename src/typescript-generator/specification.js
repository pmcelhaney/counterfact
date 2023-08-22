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

  // eslint-disable-next-line max-statements
  async loadFile(urlOrPath) {
    log("check cache for", urlOrPath);

    if (this.cache.has(urlOrPath)) {
      log("cache hit for", urlOrPath);

      return this.cache.get(urlOrPath);
    }

    log("cache miss for", urlOrPath, "do readFile()");

    const source = await readFile(urlOrPath, "utf8");

    log("finshed readFile() for", urlOrPath);

    log("now doing yaml.load() for", urlOrPath);

    const data = await yaml.load(source);

    log("finished yaml.load() for", urlOrPath);

    this.cache.set(urlOrPath, data);

    log("getting rootRequirement for", urlOrPath);

    this.rootRequirement = new Requirement(data, `${urlOrPath}#`, this);

    log("got rootRequirement for", urlOrPath);

    return data;
  }
}
