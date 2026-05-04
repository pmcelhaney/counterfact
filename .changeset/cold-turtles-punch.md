---
"counterfact": patch
---

Cast parameters at runtime: parameters defined with OAS3-style schema types (e.g. `schema: { type: "integer" }`) are now correctly cast to their declared JavaScript types in route handlers. For example, when `GET /pet/1` is called, `$.path.petId` will be a number rather than a string when the OpenAPI spec declares it as `integer`.
