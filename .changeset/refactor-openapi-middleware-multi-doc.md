---
"counterfact": patch
---

Refactor `openapiMiddleware` to accept an array of `{ path, baseUrl, id }` document descriptors. When the array contains a single entry the document is still served at `/counterfact/openapi` (backward-compatible). When multiple entries are provided each document is served at `/counterfact/openapi/{id}`.
