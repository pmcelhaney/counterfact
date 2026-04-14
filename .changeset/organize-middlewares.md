---
"counterfact": patch
---

Organized Koa middleware into a dedicated `src/server/web-server/` directory. Each middleware constructor now takes its path prefix as the first argument, making `createKoaApp` easier to read at a glance. `openapiMiddleware` simplified to handle a single path only.
