---
name: counterfact-generator-internals
description: >
  Modify TypeScript generator internals, OpenAPI parsing/schema handling, and
  generated file writing behavior without regressing regeneration guarantees.
applyTo:
  - "packages/generator/src/**/*.ts"
  - "packages/runtime/src/server/openapi-document.ts"
  - "packages/runtime/src/server/load-openapi-document.ts"
  - "packages/generator/test/**/*.test.ts"
---

# Counterfact Generator Internals Skill

## When to use this skill

Use this skill when changing OpenAPI loading/bundling, schema-to-type generation, operation/type coders, repository/script writing, or generated versions typing.

## Files to inspect first

- `packages/generator/src/README.md`
- `packages/generator/src/code-generator.ts`
- `packages/generator/src/specification.ts`
- `packages/generator/src/requirement.ts`
- `packages/generator/src/repository.ts`
- `packages/generator/src/schema-type-coder.ts`

## Existing conventions to follow

- Keep the generator architecture layered: `Specification/Requirement` -> coders -> `Script` -> `Repository`.
- Preserve regeneration contract: existing route files are not overwritten; generated types are overwritten.
- Support OpenAPI features through typed coders and requirement traversal rather than ad-hoc string logic.
- Keep generated output deterministic and formatted via existing script/repository pipeline.
- Build migrated type emitters with `AstTypeCoder` and TypeScript factories; compose child `TypeNode`s with `writeNode()`. `write()` is a temporary bridge for remaining text emitters.
- Keep TypeScript's compiler API dependency explicit and pinned in `@counterfact/generator`; a sibling package's dependency does not satisfy the packed generator.
- Use the AST helpers for literal names, comments, and grouping. Preserve compact type-literal printing so Prettier does not introduce avoidable snapshot churn.
- Validate generated syntax and assignment behavior for escaping and union/intersection precedence; snapshots alone do not establish type correctness.
- Build generator watch sets through `@counterfact/openapi` source classification: watch every unique local contributing input (base document plus overlays), exclude remote inputs and `_`, and regenerate from the complete ordered input set after any change. Do not infer URL-ness from a string prefix.

## Common mistakes to avoid

- Overwriting user-edited route files in `Repository.writeFiles`.
- Implementing new OpenAPI behavior in only one coder path (missing runtime/type parity).
- Skipping fixture/snapshot updates for changed generated output.
- Breaking group/versioned output conventions (`types/versions.ts` per group).

## How to validate the change

- Run: `yarn lint`, `yarn build`, `yarn test`.
- Run focused generator tests first (affected coder + integration/snapshot tests in `packages/generator/test/`).
- If behavior changes for generated artifacts, verify snapshots and relevant docs (`packages/counterfact/docs/reference.md`, `packages/counterfact/docs/faq.md`).
