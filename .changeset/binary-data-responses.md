---
"counterfact": minor
---

Add support for binary data in responses. Route handlers can now return binary content using the new `binary()` method on the response builder, which accepts a `Buffer` or a base64-encoded string. OpenAPI schemas with `format: "binary"` (v3) or `type: "file"` (v2) now generate `Buffer | string` TypeScript types.
