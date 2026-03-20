# `src/util/` — Shared Utilities

This directory contains small, general-purpose helper modules that are used by multiple parts of the codebase. Each module has a single, well-defined responsibility and no dependencies on other Counterfact modules.

## Files

| File | Description |
|---|---|
| `ensure-directory-exists.js` | Creates a directory (and any missing parents) synchronously before writing a file |
| `read-file.ts` | Reads text content from a local file path, an `http://` URL, or a `file://` URL |
| `wait-for-event.ts` | Returns a `Promise` that resolves when a named event fires on an `EventEmitter` or `EventTarget` |
| `windows-escape.js` | Escapes colons in Windows file paths (e.g. `C:\...`) using a Unicode substitute character to avoid conflicts in URLs and import paths |
