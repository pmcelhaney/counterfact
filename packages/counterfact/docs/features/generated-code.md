# Generated Code

Counterfact generates two directories from your OpenAPI document:

- 📂 **`types/`** — fully typed request/response interfaces, auto-regenerated whenever the OpenAPI document changes. Don't edit these by hand.
- 📂 **`routes/`** — one TypeScript file per API path. These are yours to edit. Out of the box each file returns a random, schema-valid response. You can leave them as-is or customize as much as you like.

See the [FAQ](../faq.md) for common questions about source control, editing, and regeneration.

No OpenAPI document? See [using Counterfact without OpenAPI](./without-openapi.md).

## Multi-version APIs

When two or more versioned specs share the same operation path (e.g. `GET /pets`), Counterfact emits a **version-mapped handler type** in the shared `types/paths/` file instead of a flat type.

```ts
// types/paths/pets.types.ts  (generated — do not edit)

import type { Versioned } from "../versions.js";
import type {
  MaybePromise,
  COUNTERFACT_RESPONSE,
} from "../../counterfact-types/index.js";
import type { HTTP_GET_$_v1 } from "../v1/paths/pets.types.js";
import type { HTTP_GET_$_v2 } from "../v2/paths/pets.types.js";

type HTTP_GET_$_Versions = { v1: HTTP_GET_$_v1; v2: HTTP_GET_$_v2 };

export type HTTP_GET = (
  $: Versioned<HTTP_GET_$_Versions>,
) => MaybePromise<COUNTERFACT_RESPONSE>;
```

Each version's strongly-typed `$` argument lives in its own subdirectory
(`types/v1/paths/pets.types.ts`, `types/v2/paths/pets.types.ts`). The shared
file imports and combines them via `Versioned<T>`, which resolves to the union
of the selected version argument types, with `version` and `minVersion()`
metadata. Use `$.minVersion("v2")` to narrow `$` to versions at or after `v2`
in the configured version order and access their version-specific fields.

When only a single (unversioned) spec is configured the output is unchanged
from the flat-type format.

## See also

- [Routes](./routes.md) — writing route handlers, reading request data, building responses
- [State](./state.md) — sharing state across routes with context objects
- [Usage](../usage.md)
