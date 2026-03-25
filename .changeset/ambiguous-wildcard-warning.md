---
"counterfact": minor
---

When multiple wildcard route handlers exist at the same path level (e.g. `/{x}` and `/{y}` as siblings), Counterfact now:

1. Logs an error to stderr at load time listing the conflicting wildcard names.
2. Returns an HTTP 500 response when a request could be routed to two or more handlers due to the ambiguity.
