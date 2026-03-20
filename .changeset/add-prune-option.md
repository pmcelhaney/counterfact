---
"counterfact": minor
---

Added `--prune` option to remove route files that no longer exist in the OpenAPI spec.

When an OpenAPI spec renames a path parameter (e.g. `/pet/{id}/update/{Name}` → `/pet/{id}/update/{nickname}`), running without `--prune` leaves the old file in place alongside the newly generated one, causing wildcard ambiguity in route matching. The new flag cleans up defunct route files before generation runs.

```sh
npx counterfact openapi.yaml ./out --generate --prune
```

Context files (`_.context.ts`) and empty directories are handled correctly — context files are never pruned, and any directories left empty after pruning are removed automatically.
