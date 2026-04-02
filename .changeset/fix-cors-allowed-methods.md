---
'counterfact': patch
---

Fix `Access-Control-Allow-Methods` CORS header to reflect only the HTTP methods actually implemented by the route handler, instead of hardcoding `GET,HEAD,PUT,POST,DELETE,PATCH` for every route.
