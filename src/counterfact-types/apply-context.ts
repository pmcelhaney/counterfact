/**
 * The `$` argument passed to named functions in `.apply` scripts executed from
 * the Counterfact REPL. It provides live access to the running server's context
 * and routing state.
 *
 * @example
 * ```ts
 * // repl/sold-pets.ts
 * import type { ApplyContext } from "counterfact";
 *
 * export function soldPets($: ApplyContext) {
 *   $.context.petService.reset();
 *   $.context.petService.addPet({ id: 1, status: "sold" });
 * }
 * ```
 */
export interface ApplyContext {
  context: unknown;
  loadContext: (path: string) => unknown;
}
