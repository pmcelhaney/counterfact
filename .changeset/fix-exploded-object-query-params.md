---
"counterfact": patch
---

Fix: query parameters of type object with exploded form style (the OpenAPI default) are now properly supported. The request validator no longer falsely reports required object parameters as missing when their properties are sent as individual query params (e.g. `?page=0&size=100`). The handler receives the object assembled under the parameter name (`$.query.pageable`) rather than only the flat individual keys.
