/**
 * The argument passed to the `Context` class constructor in `_.context.ts`.
 * Use it to type the `$` parameter so you get full IDE support and compile-time
 * safety when accessing `loadContext` and `readJson`.
 *
 * @example
 * ```ts
 * import type { ContextConstructorArgument } from "../counterfact-types/index.js";
 *
 * export class Context {
 *   constructor($: ContextConstructorArgument) {
 *     // $.loadContext("/some/path") — access another context object
 *     // $.readJson("./data.json")  — load a JSON file relative to this file
 *   }
 * }
 * ```
 */
export interface ContextConstructorArgument {
  loadContext: (path: string) => unknown;
  readJson: (path: string) => Promise<unknown>;
}
