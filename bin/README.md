# `bin/` — CLI Entry Point

This directory contains the executable script that is run when a developer invokes `npx counterfact` (or `counterfact` after a global install).

## Files

| File | Description |
|---|---|
| `counterfact.js` | Parses command-line arguments with [Commander](https://github.com/tj/commander.js), validates inputs, and calls `counterfact()` from `src/app.ts` to start the server, code generator, file watcher, and/or REPL |

## How It Works

```
npx counterfact@latest openapi.yaml ./api [options]
        │
        ▼
┌────────────────────────────┐
│     counterfact.js         │
│                            │
│  1. Parse args (Commander) │
│  2. Load counterfact.yaml  │
│  3. Merge config + args    │
│  4. Resolve paths          │
│  5. Build Config object    │
│  6. Run migrations if      │
│     old layout detected    │
│  7. Call start(config)     │
│     from src/app.ts        │
└────────────────────────────┘
```

### Key CLI Options

| Option | Description |
|---|---|
| `--port <number>` | HTTP server port (default: `3100`) |
| `-o, --open` | Open the dashboard in a browser after startup |
| `-g, --generate` | Generate route and type files from the OpenAPI spec |
| `-w, --watch` | Re-generate whenever the spec changes |
| `-s, --serve` | Start the HTTP server |
| `-r, --repl` | Start the interactive REPL |
| `--spec <path>` | Path or URL to the OpenAPI document (alternative to positional argument) |
| `--proxy-url <url>` | Forward all unmatched requests to this upstream URL |
| `--prefix <path>` | Base path prefix for all routes (e.g. `/api/v1`) |
| `--no-update-check` | Disable the npm update check on startup |
| `--no-validate-request` | Disable request validation against the OpenAPI spec |
| `--config <path>` | Path to a `counterfact.yaml` config file (default: `counterfact.yaml` in the current directory) |

Run `npx counterfact@latest --help` to see the full option list.

### Config File

Any CLI option can also be specified in a `counterfact.yaml` file in the current working directory. Command-line options always take precedence.

```yaml
# counterfact.yaml
spec: ./openapi.yaml
port: 8080
serve: true
repl: true
watch: true
proxy-url: https://api.example.com
prefix: /api/v1
```

Use `--config <path>` to load a config file from a non-default location.
