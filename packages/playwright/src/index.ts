import { cp, mkdtemp, rm, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  test as base,
  mergeTests,
  type TestType,
  type PlaywrightTestArgs,
  type PlaywrightTestOptions,
  type PlaywrightWorkerArgs,
  type PlaywrightWorkerOptions,
} from "@playwright/test";
import { counterfact, type Simulator } from "counterfact";

export interface CounterfactTestOptions {
  /** API source directory, resolved relative to process.cwd(). */
  basePath: string;
}

export interface CounterfactFixtures {
  /** Named scenario applied after reset. This option has test scope. */
  scenarioName: string | undefined;
  /** Live simulator after reset and optional scenario setup. */
  simulator: Simulator;
}

export interface CounterfactWorkerFixtures {
  /** Worker resource; use simulator in tests to depend on completed setup. */
  workerSimulator: Simulator;
  /** HTTP origin of this worker's OS-assigned listener. */
  simulatorURL: string;
}

// Keep installed runtime imports resolvable after relocating API source. The
// dependency tree is shared; application state belongs in stores and contexts.
async function linkDependencies(sourcePath: string, temporaryPath: string) {
  let directory = sourcePath;
  while (true) {
    const dependencies = path.join(directory, "node_modules");
    try {
      if ((await stat(dependencies)).isDirectory()) {
        await symlink(
          dependencies,
          path.join(temporaryPath, "node_modules"),
          "junction",
        );
        return;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const parent = path.dirname(directory);
    if (parent === directory) return;
    directory = parent;
  }
}

type CounterfactTest = TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & CounterfactFixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions & CounterfactWorkerFixtures
>;

/** Create fixtures, optionally composing an existing extended Playwright test. */
export function createCounterfactTest(
  options: CounterfactTestOptions,
): CounterfactTest;
export function createCounterfactTest<T extends object, W extends object>(
  options: CounterfactTestOptions,
  existingTest: TestType<T, W>,
): TestType<T & CounterfactFixtures, W & CounterfactWorkerFixtures>;
export function createCounterfactTest<T extends object, W extends object>(
  { basePath }: CounterfactTestOptions,
  existingTest?: TestType<T, W>,
) {
  const sourcePath = path.resolve(basePath);
  const fixtures = base.extend<CounterfactFixtures, CounterfactWorkerFixtures>({
    scenarioName: [undefined, { option: true }],
    workerSimulator: [
      // Playwright requires destructuring even when there are no dependencies.
      // eslint-disable-next-line no-empty-pattern
      async ({}, use) => {
        const temporaryPath = await mkdtemp(
          path.join(tmpdir(), "counterfact-playwright-"),
        );
        try {
          const isolatedPath = path.join(temporaryPath, "api");
          await cp(sourcePath, isolatedPath, {
            recursive: true,
            dereference: true,
            // Never inherit stale generated caches or a dependency tree.
            filter: (source) =>
              ![".cache", "node_modules"].includes(path.basename(source)),
          });
          await linkDependencies(sourcePath, temporaryPath);
          const simulator = await counterfact({
            basePath: isolatedPath,
            port: 0,
          });
          const { stop } = await simulator.start();
          try {
            await use(simulator);
          } finally {
            await stop();
          }
        } finally {
          await rm(temporaryPath, { recursive: true, force: true });
        }
      },
      { scope: "worker" },
    ],
    simulatorURL: [
      async ({ workerSimulator }, use) => {
        const { address } = workerSimulator.status();
        if (!address) throw new Error("Counterfact is not listening");
        await use(`http://localhost:${address.port}`);
      },
      { scope: "worker" },
    ],
    simulator: [
      async ({ workerSimulator, scenarioName }, use) => {
        await workerSimulator.reset();
        if (scenarioName !== undefined)
          await workerSimulator.scenario(scenarioName);
        await use(workerSimulator);
      },
      { auto: true },
    ],
  });
  return existingTest ? mergeTests(existingTest, fixtures) : fixtures;
}

export { expect } from "@playwright/test";
