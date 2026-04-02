---
'counterfact': patch
---

Fix crash when a route file has a syntax error. Previously, Counterfact would crash with an unhandled promise rejection when a CommonJS route file had a syntax error. Now the server stays running and requests to that route return a 500 response with a message indicating which file has the error.
