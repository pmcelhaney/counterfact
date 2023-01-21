import nodePath from "node:path";

import yaml from "js-yaml";

import { readFile } from "../util/read-file.js";

import type { RequirementData } from "./requirement.js";
import { Requirement } from "./requirement.js";

export class Specification {
  private readonly cache: Map<string, unknown>;

  private readonly rootUrl: string;

  private rootRequirement: Requirement;

  public constructor(rootUrl: string) {
    this.cache = new Map();
    this.rootUrl = rootUrl;
  }

  public async requirementAt(url: string, fromUrl = "") {
    const [file, path] = url.split("#");

    const filePath = nodePath.join(fromUrl.split("#").at(0) ?? "", file);

    const fileUrl = filePath === "." ? this.rootUrl : filePath;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const data = (await this.loadFile(fileUrl)) as RequirementData;

    const rootRequirement = new Requirement(data, `${fileUrl}#`, this);

    return rootRequirement.select(path.slice(1));
  }

  public async loadFile(urlOrPath: string) {
    if (this.cache.has(urlOrPath)) {
      return this.cache.get(urlOrPath);
    }

    const source = await readFile(urlOrPath);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const data = (await yaml.load(source)) as RequirementData;

    this.cache.set(urlOrPath, data);

    this.rootRequirement = new Requirement(data, `${urlOrPath}#`, this);

    return data;
  }
}
