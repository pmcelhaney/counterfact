---
"counterfact": minor
---

Add request validation against the OpenAPI spec. Incoming requests are now validated by default — missing required query parameters, missing required headers, and request bodies that do not match the declared schema all result in a 400 response with a descriptive error message. Validation can be disabled with the `--no-validate-request` CLI flag.
