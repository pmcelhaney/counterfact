# Plugins

In addition to running a stand-alone server, Counterfact can plug in to an existing server.

## Koa

```js
import { fileURLToPath } from "node:url";

import Koa from "koa";
import { counterfact } from "counterfact";

import { context } from "./counterfact/context/context.js";

const PORT = 3100;

const app = new Koa();

const { koaMiddleware } = await counterfact(
  fileURLToPath(new URL("paths/", import.meta.url)),
  context
);

app.use(koaMiddleware);

app.listen(PORT);
```

## Express

TODO

## Connect

TODO
