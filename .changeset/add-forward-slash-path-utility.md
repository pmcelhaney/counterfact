---
"counterfact": patch
---

Add `toForwardSlashPath` utility function and `ForwardSlashPath` branded type. All path normalization that previously used inline `.replaceAll("\\", "/")` now goes through this single, centralized function, making Windows path handling easier to find and reason about.
