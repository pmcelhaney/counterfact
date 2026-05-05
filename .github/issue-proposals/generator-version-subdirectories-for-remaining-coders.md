---
title: "generator: update remaining TypeCoders to emit output under version subdirectories"
parentIssue: 1937
labels:
  - enhancement
  - typescript-generator
assignees: []
milestone:
---

`SchemaTypeCoder` and `ResponseTypeCoder` already emit their output under `types/<version>/...` when a non-empty `version` is set. The remaining `TypeCoder` subclasses that produce version-specific type files must be updated to follow the same convention.

## Context

The multi-version code generation strategy is:

> Every `TypeCoder` except `OperationTypeCoder` writes its output into a `types/<version>/` subdirectory when a `version` is present, so that the types for each version are fully isolated. `OperationTypeCoder` is the exception: it lives at the shared path and imports/merges types from all version subdirectories (see companion issue).

`SchemaTypeCoder` and `ResponseTypeCoder` already implement this:

```
types/v1/components/MySchema.ts
types/v1/responses/MyResponse.ts
types/v2/components/MySchema.ts
types/v2/responses/MyResponse.ts
```

The following coders still need to be updated:

- `ParametersTypeCoder` – emits `types/paths/<path>.parameters.ts`
- `ResponsesTypeCoder` – emits types for the combined response object
- `ParameterExportTypeCoder` – emits individual exported parameter types

## Proposed change

For each coder listed above, update `modulePath()` to insert the `version` segment between `types/` and the remainder of the path when `this.version` is non-empty, mirroring the pattern already used in `SchemaTypeCoder` and `ResponseTypeCoder`:

```ts
// before
return `types/paths/${pathString}.parameters.ts`;

// after
return pathJoin("types", this.version, "paths", `${pathString}.parameters.ts`);
// → "types/v1/paths/pets.parameters.ts" when version = "v1"
// → "types/paths/pets.parameters.ts"    when version = ""
```

No other behaviour should change; only the output file location is affected.

## Acceptance criteria

- [ ] `ParametersTypeCoder.modulePath()` returns `types/<version>/paths/...` when `version` is non-empty and `types/paths/...` when empty
- [ ] `ResponsesTypeCoder.modulePath()` (if it declares one) follows the same convention
- [ ] `ParameterExportTypeCoder.modulePath()` follows the same convention
- [ ] Existing unit tests for `modulePath()` on each affected coder continue to pass
- [ ] New unit tests assert the versioned path for a non-empty `version` on each affected coder
- [ ] Single-spec (no version) generation produces identical output to today
