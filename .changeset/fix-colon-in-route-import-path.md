---
'counterfact': patch
---

Fix import path in generated route handler files when the OpenAPI path contains a colon (e.g. `/stuff:action`). Previously, the import statement used a literal `:` but the type file was written to disk with the Unicode ratio symbol `∶` (U+2236), causing TypeScript to fail to resolve the type and fall back to `any`.
