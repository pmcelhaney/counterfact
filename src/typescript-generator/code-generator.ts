import { type FSWatcher, watch } from "chokidar";

import { CHOKIDAR_OPTIONS } from "../server/constants.js";
import { waitForEvent } from "../util/wait-for-event.js";
import { generate } from "./generate.js";

/**
 * Wraps the {@link generate} function with file-system watching support.
 *
 * When {@link watch} is called, Counterfact watches the source OpenAPI document
 * for changes and re-runs code generation automatically.  `"generate"` and
 * `"failed"` events are emitted after each attempt.
 */
export class CodeGenerator extends EventTarget {
  private readonly openapiPath: string;

  private readonly destination: string;

  private readonly generateOptions: {
    prune?: boolean;
    routes: boolean;
    types: boolean;
    group?: string;
  };

  private watcher: FSWatcher | undefined;

  public constructor(
    openApiPath: string,
    destination: string,
    generateOptions: {
      prune?: boolean;
      routes: boolean;
      types: boolean;
      group?: string;
    },
  ) {
    super();
    this.openapiPath = openApiPath;
    this.destination = destination;
    this.generateOptions = generateOptions;
  }

  /** Runs code generation once and resolves when complete. */
  public async generate() {
    await generate(this.openapiPath, this.destination, this.generateOptions);
  }

  /**
   * Starts watching the OpenAPI document for changes.
   *
   * Has no effect when `openApiPath` is a URL (HTTP sources are not watched).
   * Resolves once the watcher is ready.
   */
  public async watch() {
    if (this.openapiPath.startsWith("http")) {
      return;
    }

    this.watcher = watch(this.openapiPath, CHOKIDAR_OPTIONS).on(
      "change",
      () => {
        void generate(
          this.openapiPath,
          this.destination,
          this.generateOptions,
        ).then(
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

  /** Closes the file-system watcher. */
  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }
}
