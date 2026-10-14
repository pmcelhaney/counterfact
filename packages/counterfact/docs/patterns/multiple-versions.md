# Multiple API Versions

Serve multiple API versions from one project, sharing the handlers and branching only where the contract actually differs.

## Why teams use this

Versioned APIs introduce change gradually: a new field in the response, a renamed parameter, a removed endpoint. Duplicating every handler for every version creates a maintenance burden and lets the versions drift. You need a way to share as much handler logic as possible across versions while still making version-specific adjustments in the places that actually changed.

## How it works

List each versioned spec under the `spec` key in `counterfact.yaml`. Give them the same `group` and different `version` labels. Counterfact generates a shared route file per path and injects two helpers into the handler's `$` argument at runtime:

- **`$.version`** — a string identifying which version is handling the request (e.g. `"v1"`, `"v2"`).
- **`$.minVersion(min)`** — returns `true` when the current version is at or after `min` in the declared version order.

`group` and `version` organize generated files and shared state; they do not add URL segments. Set an explicit `prefix` to distinguish version URLs, or include those segments in the OpenAPI paths.

Version order is determined by the order of entries in the config — first entry is the oldest version.

Write one handler that branches on version using `$.minVersion()` instead of duplicating the file.

## Example

### Configuration

```yaml
# counterfact.yaml
spec:
  - source: ./api-v1.yaml
    group: pets
    version: v1
    prefix: /pets/v1
  - source: ./api-v2.yaml
    group: pets
    version: v2
    prefix: /pets/v2
  - source: ./api-v3.yaml
    group: pets
    version: v3
    prefix: /pets/v3
# Handlers are served at:
#   http://localhost:3100/pets/v1/...
#   http://localhost:3100/pets/v2/...
#   http://localhost:3100/pets/v3/...
```

### Handler

```ts
// pets/routes/pets/{petId}.ts
import type { HTTP_GET } from "../../types/paths/pets/{petId}.types.js";

export const GET: HTTP_GET = ($) => {
  const pet = $.context.getById($.path.petId);
  if (!pet) return $.response[404].text("Pet not found");

  // v1 returns only id and name
  if (!$.minVersion("v2")) {
    return $.response[200].json({ id: pet.id, name: pet.name });
  }

  // v2 adds the status field
  if (!$.minVersion("v3")) {
    return $.response[200].json({
      id: pet.id,
      name: pet.name,
      status: pet.status,
    });
  }

  // v3 adds the full pet object including photoUrls
  return $.response[200].json(pet);
};
```

`$.minVersion("v2")` returns `true` for requests handled by v2 and v3, and `false` for v1. The conditions layer naturally: the last `return` in the example only runs when v3 or later is handling the request.

### TypeScript narrowing

`$.minVersion()` is a type predicate. After a passing check, TypeScript narrows `$` to the eligible version argument types that satisfy the minimum, giving you accurate autocompletion and type errors for version-specific fields:

```ts
export const GET: HTTP_GET = ($) => {
  if ($.minVersion("v2")) {
    // $ is now typed as the v2 (or v3, v4, …) $ type
    // v2-only fields are available here
  }
};
```

## What you get

- A single route file covers all versions; shared logic is not duplicated across version directories.
- `$.minVersion()` expresses "this feature exists in version X and later" clearly at the point in the code where it matters.
- Adding a new version only requires adding its entry to `counterfact.yaml` and updating the handlers that actually changed — handlers that did not change continue to work across all versions.
- A shared route handler can delegate to separately authored modules for version-specific logic; the generated route file still exports the common dispatcher function.
- `$.version` and `$.minVersion()` are only present when `version` is set in the spec config. For a single, unversioned spec they are absent.

## Keep exploring

- [Executable Spec](./executable-spec.md) — run all version handlers as automated contract tests to confirm the spec and implementation stay in sync
- [Mock APIs with Dummy Data](./mock-with-dummy-data.md) — the baseline approach for populating responses this pattern extends
- [Federated Context Files](./federated-context.md) — share a single context across all versions of an API group so they see the same state
