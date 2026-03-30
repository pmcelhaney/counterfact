# `bin/` — CLI Entry Point

This directory contains the executable script that is run when a developer invokes `npx counterfact` (or `counterfact` after a global install).

## Files

| File | Description |
|---|---|
| `counterfact.js` | Parses command-line arguments with [Commander](https://github.com/tj/commander.js), validates inputs, and calls `counterfact()` from `src/app.ts` to start the server, code generator, file watcher, and/or REPL |

## How It Works

```
npx counterfact openapi.yaml ./api [options]
        │
        ▼
┌────────────────────────────┐
│     counterfact.js         │
│                            │
│  1. Parse args (Commander) │
│  2. Resolve paths          │
│  3. Build Config object    │
│  4. Run migrations if      │
│     old layout detected    │
│  5. Call start(config)     │
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

Run `npx counterfact --help` to see the full option list.
