---
"counterfact": patch
---

Refactor `src/counterfact-types/` so that each type lives in its own file with a JSDoc comment explaining its purpose. The `index.ts` now re-exports all types from the individual files. This is an internal refactor with no change to the public API.
