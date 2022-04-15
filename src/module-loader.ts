import fs from "node:fs/promises";
import path from "node:path";

import type { Registry } from "./registry";
import type { EndpointModule } from "./endpoint-module";

export class ModuleLoader {
  private readonly basePath: string;

  private readonly registry: Readonly<Registry>;

  public constructor(basePath: string, registry: Readonly<Registry>) {
    this.basePath = basePath;
    this.registry = registry;
  }

  public async load(directory = ""): Promise<void> {
    const files = await fs.readdir(path.join(this.basePath, directory), {
      withFileTypes: true,
    });

    const imports = files.flatMap(async (file) => {
      if (file.isDirectory()) {
        await this.load(path.join(directory, file.name));
        return;
      }

      // eslint-disable-next-line node/no-unsupported-features/es-syntax, import/no-dynamic-require
      const endpoint = (await import(
        path.join(this.basePath, directory, file.name)
      )) as EndpointModule;

      this.registry.add(
        `/${path.join(directory, path.parse(file.name).name)}`,
        endpoint
      );
    });
    await Promise.all(imports);
  }
}
