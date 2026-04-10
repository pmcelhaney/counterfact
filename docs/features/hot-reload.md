# Hot Reload 🔥

Save a file — any route or context file — and the running server picks it up immediately. No restart needed, and in-memory state is preserved across reloads.

This makes it fast to set up edge cases like:

- What does the UI do 8 clicks deep when the server returns a 500?
- What if there are zero results? What if there are 10,000?
- What if the server is slow?

Find the file corresponding to the route, change behavior by editing the TypeScript code, and continue testing.

Depending on the scenario, you may want to commit your changes to source control or throw them away.

## See also

- [State](./state.md) — in-memory state that survives reloads
- [REPL](./repl.md) — make changes without touching files at all
- [Usage](../usage.md)
