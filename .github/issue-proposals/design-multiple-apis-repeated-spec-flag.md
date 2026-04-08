---
title: "Design A: Multiple APIs via repeated --spec CLI flags"
parentIssue: 1718
labels:
  - enhancement
  - design
assignees: []
milestone:
---

This is one of three proposed designs for supporting multiple APIs (see #1718). It extends the existing CLI in the most minimal, backwards-compatible way: let users repeat `--spec` (and the related flags) for every additional API.

## Summary

Allow `--spec` to be specified more than once on the command line. Each occurrence pairs with a `--destination` and an optional `--prefix`. Counterfact starts one code-generator pipeline per spec and mounts all dispatchers under the same Koa server.

### Example invocation

```sh
counterfact \
  --spec ./specs/users.yaml   --destination ./users   --prefix /users \
  --spec ./specs/products.yaml --destination ./products --prefix /products \
  --port 3100 --serve --generate
```

A positional-argument shorthand still works for the single-API case:

```sh
counterfact openapi.yaml ./api          # today's usage — unchanged
```

## 1. Root path determination

| Priority | Source |
|----------|--------|
| 1 (explicit) | `--prefix` paired with that `--spec` occurrence |
| 2 (OpenAPI 2.x) | `basePath` field in the spec |
| 3 (OpenAPI 3.x) | Path component of the first entry in `servers[].url` |
| 4 (fallback) | Slugified basename of the spec file (`users.yaml` → `/users`) |

If two or more specs resolve to the same root path after all four steps, Counterfact prints a descriptive error and exits before starting the server.

## 2. Generated code layout

Each spec generates into its own isolated `--destination` directory. The layout within each destination is identical to what Counterfact generates today:

```
users/          ← --destination ./users
  routes/
    GET.ts
    {userId}/
      GET.ts
  .cache/
  types.d.ts

products/       ← --destination ./products
  routes/
    GET.ts
  .cache/
  types.d.ts
```

Because destinations are separate file trees, TypeScript type names never clash regardless of how the schemas are named inside each spec.

## 3. Other implications

**Backwards compatibility.** A single `--spec` with no `--destination` or `--prefix` behaves exactly as today. No existing usage breaks.

**Swagger UI.** Each API is served at `/counterfact/swagger/<slug>` (e.g. `/counterfact/swagger/users`). The dashboard index page lists all mounted APIs.

**REPL.** The REPL gains a `:api <name>` command to switch the active API. Tab completion on context paths is scoped to the selected API.

**Dispatcher.** One `Dispatcher` instance is created per spec. The Koa middleware checks the URL prefix and delegates to the matching Dispatcher.

**Watch mode.** `--watch` applies independently to each spec. A change to `users.yaml` only re-generates `users/`; it does not re-generate `products/`.

**Proxy.** `--proxy-url` applies globally. Per-API proxy overrides can be addressed in a follow-up.

**Admin API.** `/_counterfact/api/config` returns an array of API descriptors instead of a single object.

## Acceptance criteria

- [ ] `--spec` can be repeated; each occurrence is treated as a separate API
- [ ] A missing `--prefix` falls back through the spec-derived rules above
- [ ] Conflicting root paths produce a clear error before startup
- [ ] A single `--spec` (or positional argument) continues to work exactly as today
- [ ] Generated files land in separate destination directories with no naming collisions
- [ ] The dashboard lists all mounted APIs and links to each Swagger UI
- [ ] `yarn lint`, `yarn test`, and `yarn test:black-box` all pass
