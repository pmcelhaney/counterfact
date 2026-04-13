---
"counterfact": minor
---

Add support for multiple APIs at different base paths via a `specs` array in `counterfact.yaml`.

When `specs` is present it takes precedence over `spec`. Each entry accepts `source` (path or URL to an OpenAPI document) and `base` (URL base path with no leading `/`, e.g. `billing`).

Example `counterfact.yaml`:

```yaml
specs:
  - source: ./billing.yaml
    base: billing

  - source: https://example.com/identity.yaml
    base: identity
```

- Routes are generated under `routes/<base>/` and types under `types/<base>/paths/`.
- A single `_.context.ts` remains at `routes/_.context.ts`; no per-base context file is created.
- All specs share one running server; routes are accessible at their base paths (e.g. `GET /billing/invoices`).
