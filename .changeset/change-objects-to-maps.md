---
"counterfact": patch
---

Refactor internal plain objects to Maps where appropriate:
- `Directory.directories` and `Directory.files` in `module-tree.ts` are now `Map<string, Directory>` and `Map<string, File>`
- `ParameterTypes` inner types in `dispatcher.ts` are now `Map<string, string>`
- `castParameters` in `registry.ts` now accepts `Map<string, string>` for parameter types
