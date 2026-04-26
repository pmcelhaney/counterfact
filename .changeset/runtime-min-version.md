---
"counterfact": minor
---

Add runtime implementation of `$.minVersion()` for versioned route handlers.

When multiple versioned specs share the same API group, each request's `$`
argument now includes:

- `version` — a string identifying which version is handling the request
  (e.g. `"v1"`, `"v2"`).
- `minVersion(min)` — a method that returns `true` when the current version
  is greater than or equal to `min` in the declared version order, and
  `false` otherwise.

The version order is determined by the position of each spec in the `specs`
array passed to `counterfact()` (first entry = oldest version).

For unversioned runners (`version` is not set), neither `version` nor
`minVersion` is present on `$`.
