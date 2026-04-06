---
"counterfact": minor
---

Add REPL-native request builder (`route()`) with fluent API, OpenAPI introspection, and autocomplete support.

The new `route()` function is available in the REPL and allows users to discover, construct, and execute API requests interactively:

```js
const pet = route("/pet/{petId}")
  .method("get")
  .path({ petId: 1 });

await pet.send();
```

Key capabilities:
- Fluent, immutable builder API (`.method()`, `.path()`, `.query()`, `.headers()`, `.body()`)
- OpenAPI-backed introspection via `.help()`, `.ready()`, and `.missing()`
- Actionable feedback when required parameters are absent
- Custom REPL display showing parameter status
- Autocomplete for `route("` in addition to existing `client.*` patterns
