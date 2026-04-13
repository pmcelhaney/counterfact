---
"counterfact": patch
---

Moved `openapi-example.yaml` from the repository root into `test/fixtures/openapi-example.yaml` and expanded it with many OpenAPI edge cases: CRUD operations on `/users` and `/users/{userId}`, polymorphic events via `oneOf`/`allOf`/`discriminator`, nullable fields, enum types, integer formats, file upload via `multipart/form-data`, cookie parameters, deprecated endpoints, multiple response content types, a no-body `204` health-check endpoint, and free-form `additionalProperties` objects.
