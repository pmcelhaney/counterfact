/**
 * Extracts the union of all version-specific argument types from a
 * version map `T`.
 *
 * When a multi-version API shares a route path, the route handler receives
 * a `$` argument typed as `Versioned<{ v1: V1$, v2: V2$ }>`, which resolves
 * to `V1$ | V2$`. The handler can then narrow the union to a specific
 * version using discriminant fields on `$`.
 *
 * @example
 * ```ts
 * type HTTP_GET = ($: Versioned<{ v1: HTTP_GET_$_v1; v2: HTTP_GET_$_v2 }>) =>
 *   MaybePromise<COUNTERFACT_RESPONSE>;
 * ```
 */
export type Versioned<T extends Record<string, unknown>> = T[keyof T];
