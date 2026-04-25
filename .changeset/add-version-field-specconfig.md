---
"counterfact": minor
---

Add optional `version` field to `SpecConfig` and CLI `SpecOptionEntry`. Two specs may now share the same `group` as long as each carries a distinct non-empty `version`. Mixed configurations (same-group entries with and without `version`) continue to produce a clear validation error.
