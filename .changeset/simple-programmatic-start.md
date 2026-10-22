---
"counterfact": minor
---

Simplify programmatic startup: `counterfact({ basePath: "api" })` now supplies defaults for all other runtime options, and `api.start()` reuses that configuration. Serve existing routes on port 8100 without generation or a REPL by default. Full configurations and explicit startup options remain supported. Update the embedding and integration-test guides to show the minimal setup.
