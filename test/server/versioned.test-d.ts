import { expectAssignable, expectNotAssignable, expectType } from "tsd";

import type { Versioned } from "../../src/counterfact-types/index.ts";

// ──────────────────────────────────────────────────────────────────────────────
// Shared type fixtures
// ──────────────────────────────────────────────────────────────────────────────

type V1Args = { query: { page: number } };
type V2Args = { query: { page: number; limit: number } };
type V3Args = { query: { page: number; limit: number; sort: string } };

// ──────────────────────────────────────────────────────────────────────────────
// Versioned<T> resolves to the union of all value types in T
// ──────────────────────────────────────────────────────────────────────────────

// Three-version map
type ThreeMap = { v1: V1Args; v2: V2Args; v3: V3Args };
declare const threeVer: Versioned<ThreeMap>;

expectAssignable<V1Args | V2Args | V3Args>(threeVer);
// Each member type is assignable to the union (i.e. it is one of the union's members)
declare const v1Sample: V1Args;
declare const v2Sample: V2Args;
declare const v3Sample: V3Args;
expectAssignable<Versioned<ThreeMap>>(v1Sample);
expectAssignable<Versioned<ThreeMap>>(v2Sample);
expectAssignable<Versioned<ThreeMap>>(v3Sample);

// Two-version map
type TwoMap = { v1: V1Args; v2: V2Args };
declare const twoVer: Versioned<TwoMap>;

expectAssignable<V1Args | V2Args>(twoVer);
// Not assignable to V3Args (which is not in TwoMap)
expectNotAssignable<V3Args>(twoVer);

// Single-version map collapses to just that version's type
type OneMap = { v1: V1Args };
declare const oneVer: Versioned<OneMap>;

expectType<V1Args>(oneVer);

// ──────────────────────────────────────────────────────────────────────────────
// Versioned is exported from counterfact-types/index.ts
// ──────────────────────────────────────────────────────────────────────────────

// The import at the top of this file validates this; the declaration below
// additionally confirms the type is usable as a constraint.
type AnyVersioned = Versioned<Record<string, { query: unknown }>>;

declare const anyVersionedArg: AnyVersioned;

expectAssignable<AnyVersioned>(anyVersionedArg);
