---
"@counterfact/generator": patch
---

Generate TypeScript contracts, route scaffolds, versions, scenarios, middleware, and starter files from AST nodes. Preserve escaped literal names and enum values, and correctly group nested unions within intersections. Resolve context imports before printing and preserve existing route text when inserting new handlers, including function exports, aliases, and multiline imports.

Unsupported schema type strings produce `unknown` instead of being interpreted as TypeScript identifiers or syntax.
