---
"counterfact": minor
---

Add JSDoc comment generation for types from OpenAPI metadata

Generated TypeScript types now include inline JSDoc comments derived from the OpenAPI spec:

- Schema-level JSDoc from `description`/`summary`
- Property-level JSDoc including `description`, `@example`, `@default`, `@format`, and `@deprecated`
- Operation-level JSDoc from operation `summary`/`description`

This improves IDE hover documentation and AI-assisted development workflows.
