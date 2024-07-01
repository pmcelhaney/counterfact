---
"counterfact": patch
---

replaced koa-proxy with koa-proxies to get rid of a deprecation warning (as it turns out, koa-proxies had a different deprecation, but I was able to fix it with patch-package; unfortunately none of the alternatives seem to be currently maintained)
