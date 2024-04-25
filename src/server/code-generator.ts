import { type FSWatcher, watch } from "chokidar";

import { generate } from "../typescript-generator/generate.js";
import { waitForEvent } from "../util/wait-for-event.js";
import { CHOKIDAR_OPTIONS } from "./constants.js";

export class CodeGenerator extends EventTarget {
  private readonly openapiPath: string;

  private readonly destination: string;

  private watcher: FSWatcher | undefined;

  public constructor(openApiPath: string, destination: string) {
    super();
    this.openapiPath = openApiPath;
    this.destination = destination;
  }

  public async watch() {
    await generate(this.openapiPath, this.destination);

    if (this.openapiPath.startsWith("http")) {
      return;
    }

    this.watcher = watch(this.openapiPath, CHOKIDAR_OPTIONS).on(
      "change",
      () => {
        // eslint-disable-next-line promise/prefer-await-to-then
        void generate(this.openapiPath, this.destination).then(
          () => {
            this.dispatchEvent(new Event("generate"));
            return true;
          },
          () => {
            this.dispatchEvent(new Event("failed"));
            return false;
          },
        );
      },
    );

    await waitForEvent(this.watcher, "ready");
  }

  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }
}
