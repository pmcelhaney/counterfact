---
title: "Design A: Multiple APIs via repeated --spec CLI flags"
parentIssue: 1718
labels:
  - enhancement
  - design
assignees: []
milestone:
---

This is one of three proposed designs for supporting multiple APIs (see #1718). It extends the existing CLI in the most minimal, backwards-compatible way: let users repeat `--spec` for every additional API, with an optional prefix encoded directly in the flag value.

## Summary

Allow `--spec` to be specified more than once on the command line. The optional route prefix is embedded in the flag value using a `+` separator:

```
--spec [optional-prefix+]openapi-spec-location
```

All APIs share a single destination directory (`[destination]`). Each API's generated routes land in a subdirectory named after its prefix slug, making them siblings. A single `_.context.ts` at the root of the destination can be shared across all APIs.

### Example invocation

```sh
counterfact ./api \
  --spec /users+./specs/users.yaml \
  --spec /products+./specs/products.yaml \
  --port 3100 --serve --generate
```

When the prefix is omitted from the value, it is inferred automatically (see §1 below):

```sh
counterfact ./api \
  --spec ./specs/users.yaml \
  --spec ./specs/products.yaml
```

A positional-argument shorthand still works for the single-API case:

```sh
counterfact openapi.yaml ./api          # today's usage — unchanged
```

## 1. Root path determination

The prefix part of `--spec <prefix>+<location>` is parsed by splitting on the first `+`. If no `+` is present the whole value is the spec location and the prefix is inferred in this order:

| Priority | Source |
|----------|--------|
| 1 (explicit) | Part before the `+` in the `--spec` value |
| 2 (OpenAPI 2.x) | `basePath` field in the spec |
| 3 (OpenAPI 3.x) | Path component of the first entry in `servers[].url` |
| 4 (fallback) | Slugified basename of the spec file (`users.yaml` → `/users`) |

If two or more specs resolve to the same root path after all four steps, Counterfact prints a descriptive error and exits before starting the server.

## 2. Generated code layout

All APIs are generated as siblings inside the single shared destination directory. Each API's routes land under a subdirectory whose name matches its prefix slug:

```
api/                        ← [destination] argument
  _.context.ts              ← shared root context (all APIs)
  users/                    ← prefix /users
    _.context.ts            ← context scoped to /users/*
    routes/
      GET.ts
      {userId}/
        GET.ts
    .cache/
  products/                 ← prefix /products
    _.context.ts            ← context scoped to /products/*
    routes/
      GET.ts
    .cache/
```

The sibling layout allows a root `_.context.ts` to hold shared state (e.g. a user database referenced by both the `/users` and `/products` APIs). Because routes are namespaced under their prefix subdirectory, TypeScript type names in `users/` and `products/` can never clash.

## 3. Other implications

**Backwards compatibility.** A single `--spec` with no `+` prefix and no extra `--spec` flags behaves exactly as today. No existing usage breaks.

**Swagger UI.** Each API is served at `/counterfact/swagger/<slug>` (e.g. `/counterfact/swagger/users`). The dashboard index page lists all mounted APIs.

**REPL.** The REPL gains a `:api <name>` command to switch the active API. Tab completion on context paths is scoped to the selected API.

**Dispatcher.** One `Dispatcher` instance is created per spec. The Koa middleware checks the URL prefix and delegates to the matching Dispatcher.

**Watch mode.** `--watch` applies independently to each spec. A change to `users.yaml` only re-generates routes under `users/`; it does not touch `products/`.

**Proxy.** `--proxy-url` applies globally. Per-API proxy overrides can be addressed in a follow-up.

**Admin API.** `/_counterfact/api/config` returns an array of API descriptors instead of a single object.

## Acceptance criteria

- [ ] `--spec` can be repeated; each occurrence is treated as a separate API
- [ ] `--spec /prefix+path/to/spec.yaml` parses the prefix from before the `+`
- [ ] `--spec path/to/spec.yaml` (no `+`) infers the prefix through the four-step fallback chain
- [ ] Conflicting root paths produce a clear error before startup
- [ ] A single `--spec` (or positional argument) continues to work exactly as today
- [ ] All APIs are generated as siblings inside the single destination directory
- [ ] A root `_.context.ts` in the destination directory is accessible to all API route handlers
- [ ] The dashboard lists all mounted APIs and links to each Swagger UI
- [ ] `yarn lint`, `yarn test`, and `yarn test:black-box` all pass
