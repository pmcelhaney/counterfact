---
"counterfact": minor
---

`OperationTypeCoder` now emits version-mapped handler types for multi-version APIs.

When two or more versioned specs share the same operation path, the shared
`types/paths/<path>.types.ts` file exports a merged `HTTP_<METHOD>` type
whose `$` argument is `Versioned<{ v1: …; v2: … }>` (a union of each
version's strongly-typed argument object). Each version's `$`-argument type
is emitted to `types/<version>/paths/<path>.types.ts` and imported by the
shared file.

Single-spec (unversioned) output is unchanged for full backwards compatibility.

A new `Versioned<T>` utility type is exported from `counterfact-types/index.js`.
