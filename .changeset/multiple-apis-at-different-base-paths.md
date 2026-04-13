---
"counterfact": minor
---

Add support for multiple APIs at different base paths via a `specs` array in `counterfact.yaml`.

When `specs` is present it takes precedence over `spec`.  Each entry accepts `source` (path or URL to an OpenAPI document), `prefix` (URL mount point, e.g. `/billing`), and `group` (sub-directory name for generated files, e.g. `billing`).

Example `counterfact.yaml`:

```yaml
specs:
  - source: ./billing.yaml
    prefix: /billing
    group: billing

  - source: https://example.com/identity.yaml
    prefix: /identity
    group: identity
```

- Routes are generated under `routes/<group>/` and types under `types/<group>/paths/`.
- A single `_.context.ts` remains at `routes/_.context.ts`; no per-group context file is created.
- All specs share one running server; routes are accessible at their prefixed paths (e.g. `GET /billing/invoices`).
