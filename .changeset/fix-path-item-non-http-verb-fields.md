---
"counterfact": patch
---

Fix TypeError when an OpenAPI Path Item Object contains non-HTTP-verb fields such as `summary`, `description`, `servers`, or `parameters`. These fields are now correctly ignored during code generation instead of being treated as operations.
