---
'counterfact': patch
---

Fix TypeError when a response content entry has no schema defined. Previously, the TypeScript type generator would crash with `TypeError: Cannot read properties of undefined (reading 'data')` and emit an empty error comment type. Now it gracefully falls back to `unknown` for the body type.
