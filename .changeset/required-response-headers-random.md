---
"counterfact": patch
---

Fill in required response headers in `random()`. When an OpenAPI response definition marks a header as `required: true`, the `random()` function now automatically generates a value for that header using the header's schema. Headers that are already set are not overwritten.
