---
"counterfact": patch
---

Fixed: a handler function (GET(), PUT(), etc) should always return a response, even if that response is just a status code. If the handler doesn't return, the server will response with a 500 error.
