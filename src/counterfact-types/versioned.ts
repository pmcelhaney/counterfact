/**
 * Utility type that narrows the `$` argument of a route handler to a specific
 * API version.
 *
 * In most cases, prefer importing the project-specific `Versioned` from the
 * generated `types/versions.ts`, which pre-binds `TVersions` and `TVersionsGTE`
 * to the version strings declared in your spec config.
 *
 * @typeParam TVersions - Union of all version strings (e.g. `"v1" | "v2"`).
 * @typeParam TVersionsGTE - Maps each version to the set of versions >= it.
 * @typeParam T - Map from version strings to per-version parameter/response shapes.
 * @typeParam V - The specific version(s) this handler accepts (defaults to all keys in `T`).
 */
export type Versioned<
  TVersions extends string,
  TVersionsGTE extends Record<TVersions, TVersions>,
  T extends Partial<Record<TVersions, object>>,
  V extends keyof T & TVersions = keyof T & TVersions,
> = T[V] & {
  version: V;
  minVersion<M extends keyof T & TVersions>(
    min: M,
  ): this is Versioned<TVersions, TVersionsGTE, T, Extract<V, TVersionsGTE[M]>>;
};
