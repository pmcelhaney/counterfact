import nodePath from "node:path";

import { type FSWatcher, watch } from "chokidar";

import { CHOKIDAR_OPTIONS } from "../server/constants.js";
import { waitForEvent } from "../util/wait-for-event.js";
import {
  writeDefaultScenariosIndex,
  writeScenarioContextType,
} from "./generate.js";

/**
 * Encapsulates the generation of scenario-related files:
 * - `types/_.context.ts` — the typed `Scenario$` interface derived from all
 *   `_.context.ts` files found under `routes/`.
 * - `scenarios/index.ts` — the default scenarios entry-point (created only if
 *   it does not already exist).
 *
 * When {@link watch} is called, a file-system watcher monitors the `routes/`
 * directory for changes to `_.context.ts` files and automatically regenerates
 * `types/_.context.ts`.
 */
export class ScenarioFileGenerator {
  private readonly destination: string;

  private watcher: FSWatcher | undefined;

  public constructor(destination: string) {
    this.destination = destination;
  }

  /** Generates both scenario-related files once and resolves when complete. */
  public async generate(): Promise<void> {
    await writeScenarioContextType(this.destination);
    await writeDefaultScenariosIndex(this.destination);
  }

  /**
   * Starts watching the `routes/` directory for `_.context.ts` changes and
   * regenerates `types/_.context.ts` on every change.
   *
   * Resolves once the watcher is ready.
   */
  public async watch(): Promise<void> {
    const routesDir = nodePath.join(this.destination, "routes");

    this.watcher = watch(routesDir, CHOKIDAR_OPTIONS).on("all", () => {
      void writeScenarioContextType(this.destination);
    });

    await waitForEvent(this.watcher, "ready");
  }

  /** Closes the file-system watcher. */
  public async stopWatching(): Promise<void> {
    await this.watcher?.close();
  }
}
