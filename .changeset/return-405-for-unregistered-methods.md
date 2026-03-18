---
"counterfact": patch
---

Return HTTP 405 (Method Not Allowed) with an `Allow` header when the requested path is registered but the HTTP method has no handler. Previously these requests returned 404, making it impossible to distinguish "path not found" from "method not allowed".
