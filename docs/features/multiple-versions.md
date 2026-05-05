# Multiple API Versions

Counterfact can serve several versions of the same API simultaneously from a single running process. Each version gets its own URL prefix, its own generated types, and its own route handler invocation — but all versions share the same route files.

---

## Contents

- [YAML config syntax](#yaml-config-syntax)
- [URL layout](#url-layout)
- [Generated code layout](#generated-code-layout)
- [Writing versioned route handlers](#writing-versioned-route-handlers)
- [TypeScript narrowing with `Versioned`](#typescript-narrowing-with-versioned)
- [REPL usage](#repl-usage)

---

## YAML config syntax

Declare multiple specs in `counterfact.yaml` using the `spec` array. Give them the same `group` and different `version` labels:

```yaml
# counterfact.yaml
spec:
  - source: ./openapi-v1.yaml
    group: catalog
    version: v1
  - source: ./openapi-v2.yaml
    group: catalog
    version: v2
  - source: ./openapi-v3.yaml
    group: catalog
    version: v3
```

| Field | Required | Description |
|-------|----------|-------------|
| `source` | yes | Path or URL to the OpenAPI document |
| `group` | yes | Subdirectory name under `basePath`; must be non-empty and unique across groups (not across versions of the same group) |
| `version` | no | Version label (e.g. `"v1"`, `"v2"`). When set, the routes are mounted under `/<group>/<version>`. When omitted, routes are mounted under `/<group>`. |

> **Note:** Version order matters. The first entry with a given `group` is treated as the **oldest** version. `$.minVersion()` compares against this declared order.

---

## URL layout

With the configuration above, Counterfact mounts the three specs at:

```
http://localhost:3100/catalog/v1/...
http://localhost:3100/catalog/v2/...
http://localhost:3100/catalog/v3/...
```

The prefix is derived automatically from `group` + `version`. You can override it with an explicit `prefix` field if your API uses a different URL structure:

```yaml
spec:
  - source: ./openapi-v1.yaml
    group: catalog
    version: v1
    prefix: /api/v1          # overrides the default /catalog/v1
```

---

## Generated code layout

For each group with at least one versioned spec, Counterfact generates the following layout:

```
<basePath>/
└── catalog/
    ├── routes/
    │   ├── _.context.ts             # shared state for the whole group
    │   └── items/
    │       └── {itemId}.ts          # one handler file, shared across all versions
    └── types/
        ├── paths/                   # shared request/response types (imported by handlers)
        │   └── items/
        │       └── {itemId}.types.ts
        ├── v1/                      # per-version $ arg types (auto-generated)
        │   └── paths/
        │       └── items/
        │           └── {itemId}.types.ts
        ├── v2/
        │   └── paths/ ...
        ├── v3/
        │   └── paths/ ...
        └── versions.ts              # Versions, VersionsGTE, and Versioned types
```

Key points:

- **`routes/`** is shared. A single handler file serves every version.
- **`types/paths/`** contains the handler type exports (`HTTP_GET`, `HTTP_POST`, …) that your handler imports. These are the types you use in your `import type` statements.
- **`types/<version>/paths/`** holds per-version type definitions for the `$` argument. You do not import from here directly; the generated `types/paths/` file composes them for you.
- **`types/versions.ts`** exports `Versions`, `VersionsGTE`, and `Versioned`. It is generated once per group and re-generated whenever the set of versions changes.

> **Never edit files under `types/`** — they are regenerated automatically when the spec changes.

---

## Writing versioned route handlers

A handler file lives under `routes/` and is shared by all versions. Counterfact injects two version-aware helpers into the `$` argument at runtime:

| Property | Type | Description |
|----------|------|-------------|
| `$.version` | `Versions` | The version string for the request currently being handled (e.g. `"v1"`, `"v2"`) |
| `$.minVersion(min)` | type predicate | Returns `true` when the current version is at or after `min` in the declared order |

Both properties are only present when `version` is set in the config. For a single unversioned spec they are absent.

### Example

```ts
// catalog/routes/items/{itemId}.ts
import type { HTTP_GET } from "../../types/paths/items/{itemId}.types.js";

export const GET: HTTP_GET = ($) => {
  const item = $.context.findById($.path.itemId);
  if (!item) return $.response[404].text("Item not found");

  // v1: return only id and name
  if (!$.minVersion("v2")) {
    return $.response[200].json({ id: item.id, name: item.name });
  }

  // v2: also include the category field
  if (!$.minVersion("v3")) {
    return $.response[200].json({
      id: item.id,
      name: item.name,
      category: item.category,
    });
  }

  // v3+: return the full object
  return $.response[200].json(item);
};
```

The conditions layer naturally — each `return` only runs if the previous `minVersion()` check failed. Adding a v4 later only requires adding its config entry and updating handlers that actually changed.

---

## TypeScript narrowing with `Versioned`

`$.minVersion()` is a TypeScript type predicate. After a successful check, TypeScript narrows `$` to the intersection of only the versions that satisfy the minimum:

```ts
export const GET: HTTP_GET = ($) => {
  if ($.minVersion("v2")) {
    // $ is typed as the v2 (and later) $ arg — v2-only fields are available here
    return $.response[200].json({ id: $.path.itemId, category: $.body.category });
  }

  // $ is typed as the v1 $ arg here — only v1 fields are available
  return $.response[200].json({ id: $.path.itemId });
};
```

This narrowing is powered by the `Versioned<T, V>` type in `types/versions.ts`. You do not need to import or use it directly — the generated `HTTP_GET` (and other) types already use it as the type of `$`.

### The `Versioned` type

`Versioned<T, V>` is the type of the `$` argument in a versioned handler. It has two generic parameters:

| Parameter | Description |
|-----------|-------------|
| `T` | A map from version string to the `$`-arg type for that version (e.g. `{ v1: $v1, v2: $v2 }`) |
| `V` | The union of currently active version keys (defaults to all keys of `T`) |

It exposes:

- **All properties of `T[V]`** — the intersection of properties available in the current version.
- **`version: V`** — the current version string at runtime.
- **`minVersion<M>(min: M): this is Versioned<T, Extract<V, VersionsGTE[M]>>`** — type predicate that narrows `$` to versions ≥ `min`.

---

## REPL usage

When running multiple APIs in one process, the REPL groups state by API group:

```js
// Access context for the catalog group
context.catalog

// Access routes for the catalog group
routes.catalog
```

`loadContext` and `route` are similarly grouped:

```js
loadContext.catalog("/items")
route.catalog("/items/{itemId}")
```

### Running scenario scripts for a versioned group

Use `.scenario <group> <path>` to run a scenario for a specific group:

```
⬣> .scenario catalog resetInventory
```

Tab completion supports this: `.scenario <Tab>` suggests groups first; `.scenario catalog <Tab>` suggests scenario paths within the `catalog` group.

| Command | Group | File | Function |
|---------|-------|------|----------|
| `.scenario catalog resetInventory` | `catalog` | `catalog/scenarios/index.ts` | `resetInventory` |
| `.scenario catalog items/seedData` | `catalog` | `catalog/scenarios/items.ts` | `seedData` |

---

## See also

- [Patterns: Multiple API Versions](../patterns/multiple-versions.md) — cookbook pattern with a worked example
- [Reference: `version` field and `Versioned` type](../reference.md#multiple-api-versions)
- [REPL](./repl.md) — interactive terminal for runtime inspection
- [Generated code](./generated-code.md) — how code generation works
- [Usage](../usage.md)
