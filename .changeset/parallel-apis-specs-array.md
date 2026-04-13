---
"counterfact": minor
---

Add `specs` array to `counterfact.yaml` for parallel APIs.

A `specs` key can now be added to `counterfact.yaml` to mount multiple OpenAPI documents at distinct URL base paths from a single server instance. When `specs` is present it takes precedence over `spec`.

```yaml
specs:
  - source: ./billing.yaml
    base: billing

  - source: https://example.com/identity.yaml
    base: identity
```

Each spec generates route and type files into its own subdirectory under the configured destination (e.g. `billing/routes/` and `identity/routes/`). A separate `Dispatcher`, `Registry`, `CodeGenerator`, and `ModuleLoader` is created per spec, keeping each class focused on a single API.
