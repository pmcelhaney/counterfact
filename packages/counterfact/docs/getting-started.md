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

The guided example works offline. Before starting, Counterfact shows the new
`counterfact-demo/` directory and local server address. Press Enter to start,
`p` to change the port, or `b` to go back. If that directory already exists,
Counterfact chooses a new numbered directory and preserves your existing files.

Once the API is running, the tutorial gives you one action at a time:

1. Type `await client.get("/tickets/1")` at the Counterfact prompt. The ticket
   initially has status `open`.
2. Open the route file shown in the terminal, change `status: "open"` to
   `status: "closed"`, and save it in your editor.
3. Run the same request again. When the API returns `closed`, the tutorial
   confirms your edit is live without a restart.

Use `.tutorial` or `.tutorial repeat` for the current instruction. Use
`.tutorial skip` to leave the lesson while keeping the server and REPL running.
Your example files remain available after you quit; the terminal prints the
command to restart that project. The browser is optional throughout the lesson.

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
