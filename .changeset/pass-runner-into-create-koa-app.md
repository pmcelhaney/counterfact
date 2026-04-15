---
"counterfact": minor
---

Add `openApiPath` and `prefix` as public readonly properties on `ApiRunner`.

Refactor `createKoaApp` to accept `runner: ApiRunner` (providing the dispatcher, registry, context registry, OpenAPI path, and route prefix) instead of a `config: Config` monolith plus separate sub-system refs. All other config fields used by `createKoaApp` are now explicit named arguments, laying the groundwork for passing multiple runners to `createKoaApp` in the future.
