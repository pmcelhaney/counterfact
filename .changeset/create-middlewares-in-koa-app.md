---
"counterfact": minor
---

`createKoaApp()` now accepts named parameters via destructuring (`{ config, dispatcher, registry, contextRegistry }`) and creates `routesMiddleware` and `adminApiMiddleware` internally. `counterfact()` no longer returns `routesMiddleware`.
