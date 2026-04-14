---
"counterfact": patch
---

Refactor `createKoaApp()` to accept `adminApiMiddleware` as a parameter instead of constructing it internally. Rename the `koaMiddleware` parameter and export to `routesMiddleware`.
