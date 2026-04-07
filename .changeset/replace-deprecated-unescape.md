---
"counterfact": patch
---

Replace deprecated `unescape()` with `decodeURIComponent()` wrapped in a try/catch in `requirement.ts`. This avoids use of the deprecated global function while preserving the behavior of returning invalid percent-encoded sequences unchanged.
