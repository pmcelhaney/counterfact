export const STARTUP_FLAG = "__counterfact_startup__";

/**
 * Marks a scenario function as a startup scenario.
 * Startup scenarios are executed automatically when the server starts,
 * right before the REPL begins. Use them to seed initial data.
 *
 * @example
 * ```ts
 * import { startup } from "counterfact";
 * import type { Scenario } from "../types/scenario-context.js";
 *
 * export const seedData = startup<Scenario>(($) => {
 *   $.context.pets = [{ id: 1, name: "Fluffy", status: "available" }];
 * });
 * ```
 */
// `any[]` is intentional: using `unknown[]` would break the constraint for
// typed scenario functions like `Scenario = ($: ApplyContext) => void`
// because parameter types are contravariant and `unknown` is not assignable
// to `ApplyContext`. The generic `T` preserves the actual call signature.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function startup<T extends (...args: any[]) => unknown>(fn: T): T {
  (fn as Record<string, unknown>)[STARTUP_FLAG] = true;
  return fn;
}

export function isStartupFunction(value: unknown): boolean {
  return (
    typeof value === "function" &&
    (value as unknown as Record<string, unknown>)[STARTUP_FLAG] === true
  );
}
