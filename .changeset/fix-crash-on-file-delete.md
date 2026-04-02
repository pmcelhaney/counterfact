---
'counterfact': patch
---

Fix crash when a route file is deleted while the server is running. Previously, the file-watch handler would attempt to re-import the deleted file after removing it from the registry, causing a `TypeError`. Now the handler returns immediately after processing the `unlink` event.
