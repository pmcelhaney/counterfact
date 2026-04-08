---
title: "Design B: Multiple APIs via declarative counterfact.config.ts"
parentIssue: 1718
labels:
  - enhancement
  - design
assignees: []
milestone:
---

This is one of three proposed designs for supporting multiple APIs (see #1718). It introduces a typed configuration file—`counterfact.config.ts`—that replaces (or supplements) the CLI for multi-API setups, following the convention established by tools like Vite and Jest.

## Summary

When Counterfact is launched without positional arguments (or with `--config`), it looks for `counterfact.config.ts` (or `.js`, `.json`) in the working directory. The file exports a configuration object that can describe multiple APIs in a typed, version-controllable way.

### Example config file

```ts
// counterfact.config.ts
import { defineConfig } from "counterfact";

export default defineConfig({
  port: 3100,
  apis: [
    {
      name: "Users",
      spec: "./specs/users.yaml",
      destination: "./users",
      prefix: "/users",
    },
    {
      name: "Products",
      spec: "https://example.com/products/openapi.json",
      destination: "./products",
      // prefix omitted → derived from spec or directory name
    },
  ],
  serve: true,
  generate: true,
  watch: true,
});
```

CLI flags remain available and override values from the config file, enabling easy one-off overrides without editing the file.

## 1. Root path determination

The `prefix` field in each `ApiEntry` is optional:

| Priority | Source |
|----------|--------|
| 1 (explicit) | `prefix` in the `ApiEntry` object |
| 2 (OpenAPI 2.x) | `basePath` field in the spec |
| 3 (OpenAPI 3.x) | Path component of the first `servers[].url` entry |
| 4 (fallback) | `/<name>` slugified (e.g. `"Users"` → `/users`) |

Conflicting prefixes (two APIs resolving to the same root) produce a descriptive startup error.

## 2. Generated code layout

Each `ApiEntry` specifies its own `destination`. Within each destination the layout is identical to today's single-API output:

```
users/
  routes/
    GET.ts
    {userId}/GET.ts
  .cache/
  types.d.ts

products/
  routes/
    GET.ts
  .cache/
  types.d.ts
```

The `defineConfig` helper is exported from the `counterfact` package and is fully typed, giving IDE auto-complete and compile-time validation for all options.

## 3. Other implications

**Backwards compatibility.** The positional-argument CLI (`counterfact openapi.yaml ./api`) continues to work unchanged. The config file is only loaded when no positional spec argument is provided (or when `--config` is passed explicitly).

**`defineConfig` helper.** A new exported function that simply returns its argument, but enables TypeScript inference. Mirrors the pattern used by Vite (`defineConfig`), Vitest, and others familiar to the target audience.

**Schema validation.** At startup, the loaded config is validated with a JSON Schema (or Zod) to produce clear errors for missing or conflicting fields.

**Swagger UI.** Each API is accessible at `/counterfact/swagger/<slug>`. The dashboard lists all APIs.

**REPL.** The REPL gains a `:api <name>` command to switch context. API names come from the `name` field in the config.

**Watch mode.** `watch: true` at the top level watches all specs. Per-entry `watch` overrides are supported for mixed scenarios (e.g. watch local spec but not remote).

**Remote specs.** Because the config is evaluated once at startup (not on every request), remote specs can be fetched and cached locally before the server starts.

**Programmatic API.** `counterfact` can also be used as a library. The config file format doubles as the programmatic API shape:

```ts
import { counterfact, defineConfig } from "counterfact";
const server = await counterfact(defineConfig({ apis: [...] }));
await server.start(server.config);
```

## Acceptance criteria

- [ ] `counterfact.config.ts` (and `.js`, `.json`) is loaded automatically when present and no positional spec is provided
- [ ] `defineConfig` is exported from the main package entry point and is fully typed
- [ ] All fields in a single-API config are equivalent to today's CLI flags
- [ ] Multiple entries in `apis` start one pipeline per entry with isolated destinations
- [ ] Missing or conflicting `prefix` values are resolved and reported clearly
- [ ] CLI flags override config-file values
- [ ] The dashboard lists all APIs and links to each Swagger UI
- [ ] `yarn lint`, `yarn test`, and `yarn test:black-box` all pass
