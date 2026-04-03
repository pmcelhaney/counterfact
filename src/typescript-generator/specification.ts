import { bundle } from "@apidevtools/json-schema-ref-parser";
import createDebug from "debug";

import { Requirement, type RequirementData } from "./requirement.js";

const debug = createDebug("counterfact:typescript-generator:specification");

export class Specification {
  public cache: Map<string, Requirement>;
  public rootRequirement!: Requirement;

  public constructor(rootRequirement?: Requirement) {
    this.cache = new Map();
    if (rootRequirement) {
      this.rootRequirement = rootRequirement;
    }
  }

  public static async fromFile(urlOrPath: string): Promise<Specification> {
    const specification = new Specification();
    await specification.load(urlOrPath);
    return specification;
  }

  public getRequirement(url: string): Requirement {
    debug("getting requirement at %s", url);

    return this.rootRequirement.select(url.slice(2))!;
  }

  public async load(urlOrPath: string): Promise<void> {
    this.rootRequirement = new Requirement(
      (await bundle(urlOrPath)) as RequirementData,
      urlOrPath,
      this,
    );
  }
}
