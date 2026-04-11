---
"counterfact": minor
---

Refactor `OpenApiDocument` from a plain interface into a class.

`OpenApiDocument` now extends `EventTarget` and manages its own lifecycle:

- `new OpenApiDocument(source)` — create an instance pointing at a local path or URL
- `await document.load()` — read and parse the file, populating `paths`, `basePath`, and `produces`
- `await document.watch()` — start watching the source file; dispatches a `"reload"` event whenever the file changes on disk
- `await document.stopWatching()` — stop the file watcher

The separate `OpenApiWatcher` class has been removed; its behaviour is now built into `OpenApiDocument`.
