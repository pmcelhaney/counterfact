---
"counterfact": patch
---

Fix REPL tab completion for built-in Node.js completions (e.g. `context.<Tab>`).

The custom route completer previously replaced Node's built-in REPL completer entirely, breaking property completion for objects like `context` and `client`. The completer now delegates to the built-in completer when the input doesn't match the `client.<method>("...")` pattern.
