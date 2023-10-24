import { type FSWatcher, watch } from "chokidar";

import { generate } from "../typescript-generator/generate.js";

export class CodeGenerator {
  private readonly openapiPath: string;

  private readonly destination: string;

  private watcher: FSWatcher | undefined;

  public constructor(openApiPath: string, destination: string) {
    this.openapiPath = openApiPath;
    this.destination = destination;
  }

  public async watch() {
    await generate(this.openapiPath, this.destination);

    if (this.openapiPath.startsWith("http")) {
      return;
    }

    this.watcher = watch(this.openapiPath).on("change", () => {
      void generate(this.openapiPath, this.destination);
    });
  }

  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }
}
