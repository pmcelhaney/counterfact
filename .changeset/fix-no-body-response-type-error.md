---
"counterfact": patch
---

fix type error when returning a response with no body (e.g. `$.response[200]` or `$.response[404]` in routes where the spec defines no response body)
