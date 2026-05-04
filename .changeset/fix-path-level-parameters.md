---
"counterfact": patch
---

Fix: parameters defined at the path item level in an OpenAPI spec are now included in generated TypeScript types.

Previously, parameters declared under a path item (e.g. `/stuff/{stuffId}: parameters: [...]`) were ignored during type generation, causing the route handler's `path` (and other) argument types to be `never`. Now those path-item-level parameters are merged with any operation-level parameters (operation-level takes precedence when both declare the same name and location), producing the correct strongly-typed handler signatures.
