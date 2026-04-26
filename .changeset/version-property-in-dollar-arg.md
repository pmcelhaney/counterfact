---
"counterfact": patch
---

Generated `$`-arg types now include a `version` property. For versioned specs the property is a string literal (e.g. `version: "v3"`); for unversioned specs it is `never` (omitted at runtime by `OmitValueWhenNever`).
