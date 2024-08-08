import { type FSWatcher, watch } from "chokidar";

import { CHOKIDAR_OPTIONS } from "../server/constants.js";
import { waitForEvent } from "../util/wait-for-event.js";
import { generate } from "./generate.js";

export class CodeGenerator extends EventTarget {
  private readonly openapiPath: string;

  private readonly destination: string;

  private readonly generateOptions: { routes: boolean; types: boolean };

  private watcher: FSWatcher | undefined;

  public constructor(
    openApiPath: string,
    destination: string,
    generateOptions: { routes: boolean; types: boolean },
  ) {
    super();
    this.openapiPath = openApiPath;
    this.destination = destination;
    this.generateOptions = generateOptions;
  }

  public async generate() {
    await generate(this.openapiPath, this.destination, this.generateOptions);
  }

  public async watch() {
    if (this.openapiPath.startsWith("http")) {
      return;
    }

    this.watcher = watch(this.openapiPath, CHOKIDAR_OPTIONS).on(
      "change",
      () => {
        void generate(this.openapiPath, this.destination, this.generateOptions)
          // eslint-disable-next-line promise/prefer-await-to-then
          .then(
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
