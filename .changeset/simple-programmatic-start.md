---
"counterfact": minor
---

Simplify programmatic startup: `counterfact({ basePath: "api" })` now supplies defaults for all other runtime options, and `api.start()` reuses that configuration. Serve routes on port 8100 without a REPL by default. Enable generation, watching, and cache building by default; supplying a spec generates routes and types and watches for changes. Explicit opt-outs remain supported. Full configurations and explicit startup options remain supported. Update the embedding and integration-test guides to show the minimal setup.

Create missing API directories during initialization. Expose `api.status()` to report the resolved configuration (excluding the Admin API token), absolute API directory, HTTP listener, and actual bound port; await listener readiness and reject startup on bind errors.

Support partial startup overrides such as `api.start({ port: 8111 })` while preserving configured defaults and reporting the effective port.
