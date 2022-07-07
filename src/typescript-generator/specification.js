import { Requirement } from "./requirement.js";

export class Specification {
  constructor() {
    this.cache = new Map();
  }

  async requirementAt(url) {
    const [file, path] = url.split("#");
    const data = await this.loadFile(file);

    const rootRequirement = new Requirement(this, `${file}#`, data);

    return rootRequirement.item(path.slice(1));
  }

  async loadFile(path) {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    const data = await "TODO - load the YAML file";

    this.cache.set(path, data);

    return data;
  }
}
