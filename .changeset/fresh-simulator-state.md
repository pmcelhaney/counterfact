---
"counterfact": minor
"@counterfact/runtime": minor
"@counterfact/repl": patch
"@counterfact/client": patch
---

Add simulator.reset() to reconstruct stores, dependent contexts, source routes and startup state without restarting HTTP, and simulator.scenario(path, group?) to await named scenarios with the REPL arguments. Document request gating, reset failure recovery, reference lifetimes, and worker-scoped Playwright integration.
