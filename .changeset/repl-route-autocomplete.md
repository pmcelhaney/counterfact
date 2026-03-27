---
"counterfact": minor
---

Add route autocomplete to REPL for `client.<method>("...")` patterns.

When typing `client.get("/p` in the REPL and pressing Tab, the REPL now suggests available routes (e.g. `/pets`, `/pets/{petId}`) derived from the route registry.

This works for all HTTP methods: `get`, `post`, `put`, `patch`, and `delete`.
