# Build the frontend. Don’t wait for the backend.

Counterfact turns an OpenAPI document into a useful local API in one command.
Use it when your frontend is ready but the backend is incomplete, unavailable,
unstable, or owned by another team.

## Prerequisite

Use Node.js 22 or newer. Counterfact supports Swagger 2.0 and OpenAPI 3.0,
3.1, and 3.2.

## Run one command

For an interactive introduction, run:

```sh
npx counterfact@latest
```

With no arguments and no `counterfact.yaml`, choose **Try a guided example**
(the default) or **Use my OpenAPI document**. Documentation is also available.

The guided example opens **Counterfact Coffee** in your browser. Instructions
stay on the left; the working shop is on the right. Keep Counterfact running
in its terminal and make file changes in your own editor.

Before starting, Counterfact shows the new `counterfact-demo/` directory and
local server address. Press Enter to start, `p` to change the port, or `b` to
go back. Existing directories are preserved by choosing a new numbered name.
The example uses bundled files and needs no contract download.

The walkthrough starts with a normal purchase, then guides you through:

1. Making sold-out Decaf available by editing `routes/products.ts`.
2. Making orders fail, preserving the cart, and restoring successful retries.
3. Adding an inventory update to `routes/orders.ts`: subtract each purchased
   quantity from `$.context.inventory`.
4. Buying the remaining Dark Roast stock and seeing the shop mark it sold out.
5. Inspecting and replenishing that same inventory through the REPL:

   ```js
   context.inventory["dark-roast"];
   context.inventory["dark-roast"] = 5;
   ```

6. Making another purchase and seeing five bags become four.

The instructions bold the next action. Cart changes and successful orders move
the emphasis automatically; confirm editor and REPL actions with the displayed
button to move to the next action. These confirmations do not complete a lesson:
the app must still receive the expected API response.

Each product card shows **Inventory in Counterfact**, **In your cart**, and
**Available to add** separately. Adding bags changes the cart and availability
immediately; reducing a quantity or removing an item restores availability.
Only the API reports inventory changes after purchases or context updates.

The shop checks the products API automatically while visible and after each
order. Saved inventory edits and REPL changes appear without a manual refresh.
**Refresh products** remains available to request another check. The left
panel confirms the responses the app actually receives. Saving a file alone
does not complete a task. **Continue** moves on after success; **Back** and **Skip lesson** let you control the pace. A browser reload
keeps the current lesson and cart within the same running API session.

Use **Open in VSCode** to open the project through the `vscode://` URL scheme,
or **Copy file path** to find the files in another editor. Shared inventory is declared in `routes/_.context.ts` and initialized
by `scenarios/index.ts`; products and orders access the same running object.
The initial order handler intentionally does not reduce stock until you add
that operation. No payments or real purchases take place.

The shop and REPL remain running after completion, and your files remain after
quitting. If a browser cannot be opened, use the walkthrough URL printed in the
terminal. The final panel prints the command to restart the project.

To use your own document, choose it from discovered local OpenAPI files or
enter a path or URL, then choose an output directory and available port.
Use `q`, Ctrl+C, or Ctrl+D to cancel setup before creating files.

If you already have a config file or pass any arguments, Counterfact uses its
usual startup behavior. In CI or without interactive input and output,
an unconfigured no-argument run prints guidance and exits. Pass a spec
explicitly for scripts, or `_` to start without OpenAPI.

Give Counterfact an OpenAPI document and an output directory:

```sh
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api
```

Counterfact writes editable route files and generated TypeScript types to
`api/`, then starts a local server at `http://localhost:3100`.

For a project or CI workflow, install a pinned version and commit the lockfile:

```sh
npm install --save-dev counterfact@2.16.3
npx counterfact ./openapi.yaml api
```

## Make a browser request

Point your frontend at the local base URL. For the Petstore document above, a
minimal request looks like this:

```ts
const response = await fetch("http://localhost:3100/pet/1");
const pet = await response.json();
```

Supported operations return schema-derived sample data immediately—before you
edit a handler. A response might look like this:

```json
{
  "id": 1,
  "name": "string",
  "status": "available"
}
```

The generated response is a useful contract-shaped starting point for frontend
work and exploration. It is not a substitute for the business behavior you
choose to model.

## Know what was generated

The output directory contains files you can own:

```text
api/
├── routes/   # editable handlers, one path at a time
└── types/    # generated request and response contracts
```

Do not edit `types/`; regenerate them when the OpenAPI document changes. Edit
handlers under `routes/`. Counterfact hot-reloads route changes while the
server is running.

## Make one response explicit (optional)

When a screen needs a specific case, replace the generated response in the
corresponding handler:

```ts
// api/routes/pet/{petId}.ts
import type { HTTP_GET } from "../../types/paths/pet/{petId}.types.js";

export const GET: HTTP_GET = ($) =>
  $.response[200].json({
    id: $.path.petId,
    name: "Fluffy",
    status: "available",
  });
```

Save the file and refresh the frontend—no server restart is needed.

## Next steps

- [First 10 minutes](./first-10-minutes.md) — add a small create/read workflow and one frontend-relevant failure.
- [Usage](./usage.md) — find guides by job: frontend, testing, advanced control, or troubleshooting.
- [Custom responses](./features/routes.md), [state](./features/state.md), [failures](./patterns/simulate-failures.md), and [proxying](./features/proxy.md) — add capabilities only when the workflow needs them.
- [Without OpenAPI](./features/without-openapi.md) — use the deeper alternative when no OpenAPI document exists.
