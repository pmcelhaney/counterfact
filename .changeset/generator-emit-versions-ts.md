---
"counterfact": minor
---

generator: emit `types/versions.ts` with `Versions`, `VersionsGTE`, and `Versioned` types

When at least one `SpecConfig` entry has a non-empty `version` field, the code generator now writes `types/versions.ts` to the `basePath` root. The file exports:

- `Versions` — a union of all distinct version strings in config-declaration order
- `VersionsGTE` — a map from each version to the set of versions that are >= it
- `Versioned<T, V>` — a utility type that narrows the `$` argument of a route handler to a specific API version

`Versioned` is also exported from `counterfact-types/index.ts` in its generic form (with explicit `TVersions` and `TVersionsGTE` type parameters) for use outside of the generated file.

No file is written when no spec defines a `version`.
