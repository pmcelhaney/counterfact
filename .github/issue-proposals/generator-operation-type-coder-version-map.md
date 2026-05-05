---
title: "generator: update OperationTypeCoder to emit version-mapped handler types"
parentIssue: 1937
labels:
  - enhancement
  - typescript-generator
assignees: []
milestone:
---

`OperationTypeCoder` currently emits a single flat handler type per operation. For multi-version APIs it must instead emit a *version map* that collects each version's strongly-typed `$` argument under a keyed object, so that the shared route handler can be narrowed to a specific version at call time.

## Context

When two or more versioned specs share the same operation path (e.g. `GET /pets`), the generated `types/paths/pets.types.ts` file cannot contain two conflicting `HTTP_GET` type definitions. Instead, `OperationTypeCoder` should emit a single merged type that covers all versions:

```ts
// types/paths/pets.types.ts  (generated, do not edit)

import type { MaybePromise, COUNTERFACT_RESPONSE } from "../../counterfact-types/index.js";
import type { Versioned } from "../../types/versions.js";
import type { HTTP_GET_$ as HTTP_GET_$_v1 } from "../../types/v1/paths/pets.types.js";
import type { HTTP_GET_$ as HTTP_GET_$_v2 } from "../../types/v2/paths/pets.types.js";

type HTTP_GET_$_Versions = {
  v1: HTTP_GET_$_v1;
  v2: HTTP_GET_$_v2;
};

export type HTTP_GET = (
  $: Versioned<HTTP_GET_$_Versions>,
) => MaybePromise<COUNTERFACT_RESPONSE>;
```

Each version's `$` argument type lives in its own subdirectory file (produced by the per-version coder invocations). `OperationTypeCoder` is responsible only for assembling the union wrapper at the shared path.

## Proposed change

1. When `version` is non-empty, `OperationTypeCoder` should write a **per-version $-argument type** (the current flat type body) to `types/<version>/paths/<path>.types.ts` instead of the shared path.
2. The shared `types/paths/<path>.types.ts` script should use `Script.declareVersion()` to accumulate version entries and ultimately emit the merged `HTTP_<METHOD>_$_Versions` map and the `HTTP_<METHOD>` wrapper that uses `Versioned<…>`.
3. `modulePath()` should return the shared `types/paths/<path>.types.ts` path (unchanged), while the per-version file path is handled by a helper or a dedicated `VersionedOperationTypeCoder`.
4. Imports of per-version types in the shared file are generated relative to the file's location in the output tree.
5. When only one version is configured (or `version` is empty), the existing flat-type output is preserved for full backwards compatibility.

## Acceptance criteria

- [ ] With two versioned specs sharing a path, the shared `types/paths/<path>.types.ts` exports an `HTTP_<METHOD>` type whose `$` argument is `Versioned<{ v1: …, v2: … }>`
- [ ] Each version's `$`-argument type is emitted to `types/<version>/paths/<path>.types.ts` and imported by the shared file
- [ ] With a single spec (no version), the generated output is identical to today
- [ ] `OperationTypeCoder` unit tests are updated/extended to cover the versioned output shape
- [ ] The generated TypeScript compiles without errors (`tsc --noEmit`) against a sample versioned spec pair
