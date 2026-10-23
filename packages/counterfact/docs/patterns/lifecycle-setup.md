# Run the lifecycle recipes from a pinned checkout

The documentation previews the current repository API. The published `counterfact@2.16.6` package does **not** provide `reset()`, `scenario()`, or the minimal-options startup used in these recipes. Do not install that release and expect the lifecycle snippets to work.

## Reproduce the documented API

Use this commit, which contains the lifecycle implementation, while working through the payment and agent recipes. Node.js 22 or newer is required. The npm commands below run a pinned Yarn version for the workspace:

```sh
git clone https://github.com/counterfact/api-simulator.git counterfact-source
cd counterfact-source
git checkout 3b9f65fe94af0efc8ef4ce4d666a6f7126f7a28c
npm exec --yes --package=@yarnpkg/cli-dist@4.18.1 -- yarn install --immutable
npm exec --yes --package=@yarnpkg/cli-dist@4.18.1 -- yarn build
mkdir workflow-trial
cd workflow-trial
```

Create the recipe's files inside `workflow-trial/`. Node resolves `counterfact` from the built parent workspace; keep the workspace and its dependencies available. Use `../node_modules/.bin/counterfact` for generation commands in these recipes, rather than letting `npx` download a release. This checkout is a development setup, not a dependency installation recipe for an application.

Verify the required public methods before proceeding:

```js
// check-lifecycle.mjs
import assert from "node:assert/strict";
import { counterfact } from "counterfact";
const api = await counterfact({ basePath: "api", port: 0 });
assert.equal(typeof api.reset, "function");
assert.equal(typeof api.scenario, "function");
const { stop } = await api.start();
await stop();
console.log("Lifecycle API available");
```

Run `node check-lifecycle.mjs`. Once a published version includes these methods, pin that verified version with `npm install --save-dev --save-exact counterfact@<version>` and commit the resulting lockfile in the consuming project. Do not infer method availability from a version label in an unreleased source checkout.

For an example using the released CLI without the lifecycle helpers, start with [your first ten minutes](../first-10-minutes.md). Continue with [payment retry](./payment-retry.md) or [AI-assisted workflows](./agentic-sandbox.md).
