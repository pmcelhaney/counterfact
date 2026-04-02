---
'counterfact': patch
---

Fix request body parsing: `RawHttpClient` now automatically sets `Content-Type: application/json` when the body is an object, so `$.body` is populated correctly in route handlers.
