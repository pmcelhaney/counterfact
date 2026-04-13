---
"counterfact": minor
---

Add startup scenario: export a function named `startup` from `scenarios/index.ts` and it will run automatically when the server initializes, right before the REPL starts. Use it to seed dummy data so the server is immediately useful without any manual REPL commands. If `startup` is not exported, the server starts normally with no error.
