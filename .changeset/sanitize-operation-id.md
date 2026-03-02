---
"counterfact": patch
---

Sanitize `operationId` values before using them as TypeScript identifiers in generated code.

Previously, any `operationId` from an OpenAPI spec was used verbatim, which could produce invalid TypeScript when the value contained hyphens, dots, spaces, or other characters not permitted in identifiers. The value is now converted to camelCase (e.g. `get-user-profile` → `getUserProfile`) and any remaining invalid characters are stripped.
