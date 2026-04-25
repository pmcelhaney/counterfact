import { expectAssignable, expectNotAssignable, expectType } from "tsd";

import type { Versioned } from "../../src/counterfact-types/index.ts";

// ──────────────────────────────────────────────────────────────────────────────
// Shared type fixtures
// ──────────────────────────────────────────────────────────────────────────────

type TestVersions = "v1" | "v2" | "v3";

type TestVersionsGTE = {
  v1: "v1" | "v2" | "v3";
  v2: "v2" | "v3";
  v3: "v3";
};

type V1Args = { query: { page: number } };
type V2Args = { query: { page: number; limit: number } };
type V3Args = { query: { page: number; limit: number; sort: string } };

type TestMap = { v1: V1Args; v2: V2Args; v3: V3Args };

// ──────────────────────────────────────────────────────────────────────────────
// version property is typed to the bound version parameter V
// ──────────────────────────────────────────────────────────────────────────────

declare const anyVersion: Versioned<TestVersions, TestVersionsGTE, TestMap>;

// Default V = keyof TestMap & TestVersions = "v1" | "v2" | "v3"
expectAssignable<"v1" | "v2" | "v3">(anyVersion.version);
expectNotAssignable<"v1">(anyVersion.version);

declare const v1Only: Versioned<TestVersions, TestVersionsGTE, TestMap, "v1">;

expectType<"v1">(v1Only.version);

declare const v2Only: Versioned<TestVersions, TestVersionsGTE, TestMap, "v2">;

expectType<"v2">(v2Only.version);

// ──────────────────────────────────────────────────────────────────────────────
// minVersion narrows the version to the requested floor and above
// ──────────────────────────────────────────────────────────────────────────────

function testMinVersionNarrowing(
  arg: Versioned<TestVersions, TestVersionsGTE, TestMap>,
): void {
  if (arg.minVersion("v2")) {
    // After minVersion("v2"), version is narrowed to "v2" | "v3"
    // (Extract<"v1"|"v2"|"v3", TestVersionsGTE["v2"]> = Extract<"v1"|"v2"|"v3","v2"|"v3"> = "v2"|"v3")
    expectAssignable<"v2" | "v3">(arg.version);
    expectNotAssignable<"v1">(arg.version);
  }
}

// TypeScript requires the function to be referenced to avoid dead-code removal
void testMinVersionNarrowing;

// ──────────────────────────────────────────────────────────────────────────────
// minVersion("v3") narrows to exactly "v3"
// ──────────────────────────────────────────────────────────────────────────────

function testMinVersionNarrowingToLatest(
  arg: Versioned<TestVersions, TestVersionsGTE, TestMap>,
): void {
  if (arg.minVersion("v3")) {
    expectType<"v3">(arg.version);
  }
}

void testMinVersionNarrowingToLatest;

// ──────────────────────────────────────────────────────────────────────────────
// Two-version map: Versioned with subset of versions
// ──────────────────────────────────────────────────────────────────────────────

type TwoVersions = "v1" | "v2";
type TwoVersionsGTE = { v1: "v1" | "v2"; v2: "v2" };
type TwoMap = { v1: V1Args; v2: V2Args };

declare const twoVer: Versioned<TwoVersions, TwoVersionsGTE, TwoMap>;

expectAssignable<"v1" | "v2">(twoVer.version);

function testTwoVersionMinVersion(
  arg: Versioned<TwoVersions, TwoVersionsGTE, TwoMap>,
): void {
  if (arg.minVersion("v2")) {
    expectType<"v2">(arg.version);
  }
}

void testTwoVersionMinVersion;

// ──────────────────────────────────────────────────────────────────────────────
// Single-version map: Versioned collapses to just that version
// ──────────────────────────────────────────────────────────────────────────────

type OneVersion = "v1";
type OneVersionGTE = { v1: "v1" };
type OneMap = { v1: V1Args };

declare const oneVer: Versioned<OneVersion, OneVersionGTE, OneMap>;

expectType<"v1">(oneVer.version);

// ──────────────────────────────────────────────────────────────────────────────
// Versioned is exported from counterfact-types/index.ts
// ──────────────────────────────────────────────────────────────────────────────

// The import at the top of this file validates this; the declaration below
// additionally confirms the type is usable as a constraint.
type AnyVersioned = Versioned<
  string,
  Record<string, string>,
  Record<string, object>
>;

declare const anyVersionedArg: AnyVersioned;

expectAssignable<AnyVersioned>(anyVersionedArg);
