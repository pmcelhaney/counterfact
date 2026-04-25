---
"counterfact": minor
---

When a `SpecConfig` entry declares both `group` and `version`, the server now automatically mounts that spec's routes under `/<group>/<version>` without requiring an explicit `prefix`.

The derivation rules are:

| `prefix` provided? | `group` set? | `version` set? | Derived prefix        |
|--------------------|--------------|----------------|-----------------------|
| Yes                | any          | any            | use the explicit prefix |
| No                 | Yes          | Yes            | `/<group>/<version>`  |
| No                 | Yes          | No             | `/<group>`            |
| No                 | No           | No             | `""` (root)           |

Two specs with the same `group` but different `version` values can coexist on a single server instance — validation now checks uniqueness on the `(group, version)` pair instead of `group` alone.

**Migration note:** `SpecConfig.prefix` is now an optional field (`prefix?: string`). Specs that omit `prefix` will have it derived automatically; pass an explicit `prefix: ""` to force the root prefix.
