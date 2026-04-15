---
"counterfact": minor
---

Add support for multiple API specifications via `ApiRunner`.

- `ApiRunner.create(config, group?)` now accepts an optional `group` string (default `""`) that places generated code in a subdirectory of `config.basePath`.
- `ApiRunner` exposes `group` as a public readonly property and `subdirectory` as a computed getter (returns `""` when group is empty, or `"/${group}"`).
- `CodeGenerator` receives `config.basePath + runner.subdirectory` so each spec's generated files land in the right subdirectory.
- `createKoaApp` now accepts `runners: ApiRunner[]` (an array) instead of a single `runner`. It loops over all runners to mount per-spec OpenAPI document, Swagger UI, Admin API, and route-dispatching middleware.
- `counterfact()` accepts an optional `specs: SpecConfig[]` second argument (each entry has `source`, `prefix`, and `group`). When omitted, a single spec is derived from `config.openApiPath` and `config.prefix` for full backward compatibility. The REPL is configured using the first spec's runner.
- The `spec` key in `counterfact.yaml` can now be a single `{source, prefix, group}` object or an array of such objects to configure multiple APIs from the config file.
