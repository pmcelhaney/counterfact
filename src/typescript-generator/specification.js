import nodePath from "node:path";

import createDebug from "debug";
import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";
import { Requirement } from "./requirement.js";

const debug = createDebug("counterfact:typescript-generator:specification");

const EMPTY_OPENAPI = `{
    "openapi": "3.0.0",
    "info": {
      "title": "Sample API",
      "version": "1.0.0"
    },
    "paths": {}
  }`;

export class Specification {
  constructor(rootUrl) {
    this.cache = new Map();
    this.rootUrl = rootUrl;
  }

  async requirementAt(url, fromUrl = "") {
    debug("getting requirement at %s from %s", url, fromUrl);

    const [file, path] = url.split("#");
    const filePath = nodePath
      .join(fromUrl.split("#").at(0), file)
      .replaceAll("\\", "/")
      // eslint-disable-next-line regexp/prefer-named-capture-group
      .replace(/:\/([^/])/u, "://$1");
    const fileUrl = filePath === "." ? this.rootUrl : filePath;

    debug("reading specification at %s", fileUrl);

    const data = await this.loadFile(fileUrl);

    debug("done reading specification", fileUrl);

    const rootRequirement = new Requirement(data, `${fileUrl}#`, this);

    return rootRequirement.select(path.slice(1));
  }

  async loadFile(urlOrPath) {
    debug("loading file %s", urlOrPath);

    if (this.cache.has(urlOrPath)) {
      debug("cache hit");

      return this.cache.get(urlOrPath);
    }

    debug("cache miss, reading file at %s", urlOrPath);

    const source =
      urlOrPath === "_" ? EMPTY_OPENAPI : await readFile(urlOrPath, "utf8");

    debug("read file");
    debug("parsing YAML");

    const data = await yaml.load(source);

    debug("parsed YAML: %o", data);
    this.cache.set(urlOrPath, data);
    this.rootRequirement = new Requirement(data, `${urlOrPath}#`, this);

    return data;
  }
}
