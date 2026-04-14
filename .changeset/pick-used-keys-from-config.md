---
"counterfact": patch
---

Use `Pick<Config, ...>` in function signatures to declare only the config keys each function actually uses. This improves readability and makes each function's dependencies explicit.
