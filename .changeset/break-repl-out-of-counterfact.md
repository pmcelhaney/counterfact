---
"counterfact": minor
---

Break REPL out of `counterfact()` and expose it as a callable `startRepl()` on the returned object. This enables programmatic usage (e.g. from Playwright tests) without automatically starting an interactive terminal session.

```ts
import { counterfact } from "counterfact";

const { contextRegistry, start, startRepl } = await counterfact(config);
await start(config);

// Manipulate server state directly from test code:
const rootContext = contextRegistry.find("/");
rootContext.passwordResponse = "expired";
```

The CLI (`bin/counterfact.js`) now explicitly calls `startRepl()` when `--repl` is passed, preserving existing behaviour.
