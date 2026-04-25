---
"counterfact": patch
---

Fix TypeScript error caused by combining a mapped type and explicit properties in the same generated response object type.

When an OpenAPI spec defines a `default` response alongside explicit status codes (e.g. `200`, `400`), the generated `ResponseBuilderFactory` type argument now uses an intersection (`{ 200: ..., 400: ... } & { [statusCode in Exclude<HttpStatusCode, 200 | 400>]: ... }`) instead of mixing both in a single object literal, which TypeScript does not allow.
