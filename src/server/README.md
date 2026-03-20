# `src/server/` — HTTP Server

This directory contains the Koa-based HTTP server and all of the supporting modules needed to receive requests, dispatch them to the correct route handler, and return responses.

## Files

| File | Description |
|---|---|
| `config.ts` | Defines the `Config` interface that holds all runtime configuration (port, paths, proxy settings, feature flags) |
| `constants.ts` | Exports Chokidar file-watcher options used for platform-specific file monitoring |
| `create-koa-app.ts` | Factory that builds and configures the Koa application with all middleware attached |
| `koa-middleware.ts` | Primary Koa middleware: delegates each request to the Dispatcher and formats the response |
| `admin-api-middleware.ts` | REST API for managing server state (proxy settings, etc.); restricted to loopback clients |
| `openapi-middleware.ts` | Serves the OpenAPI specification document with the current server URL injected |
| `page-middleware.ts` | Renders the built-in dashboard and API documentation pages from Handlebars templates |
| `dispatcher.ts` | Core request router: matches URL paths to route handlers, extracts path/query parameters, and drives the request lifecycle |
| `registry.ts` | In-memory store of all registered routes and their HTTP method handlers |
| `context-registry.ts` | Hierarchical store of context objects; provides path-based lookup and case-insensitive matching |
| `module-loader.ts` | Dynamically loads compiled route, context, and middleware modules; triggers hot-reload on file changes |
| `module-tree.ts` | Organises loaded modules into a tree that mirrors the routes directory structure for efficient path matching |
| `module-dependency-graph.ts` | Tracks inter-module dependencies so that reloading a changed file also reloads its dependents |
| `transpiler.ts` | Compiles `.ts` route files to `.cjs` using SWC; watches source files and recompiles on change |
| `uncached-import.ts` | Imports an ES module bypassing the module cache (used for hot-reload of ESM route files) |
| `uncached-require.cjs` | CommonJS wrapper that clears the `require` cache entry before re-importing a module |
| `determine-module-kind.ts` | Detects whether a compiled file should be loaded as ESM or CJS based on extension or `package.json` |
| `convert-js-extensions-to-cjs.ts` | Rewrites relative `require()` paths to use `.cjs` extensions for CommonJS compatibility |
| `response-builder.ts` | Constructs synthetic response payloads from OpenAPI schemas, handling JSON, XML, and content negotiation |
| `tools.ts` | Utility functions injected into route handlers: `randomFromSchema()`, `accepts()`, etc. |
| `json-to-xml.ts` | Converts a JSON value to XML text using schema hints from the OpenAPI document |
| `is-proxy-enabled-for-path.ts` | Checks whether a given URL path should be forwarded to the upstream proxy |
| `precinct.d.ts` | TypeScript declaration for the `precinct` dependency-analysis library |

## How It Works

```
Incoming HTTP request
        │
        ▼
┌───────────────────┐
│  Koa Middleware   │  (koa-middleware.ts)
│  Chain            │
│  ┌─────────────┐  │
│  │ page-mw     │  │  Renders dashboard/docs pages
│  ├─────────────┤  │
│  │ openapi-mw  │  │  Serves /counterfact/openapi.json
│  ├─────────────┤  │
│  │ admin-api   │  │  Manages proxy config, server state
│  ├─────────────┤  │
│  │ koa-mw      │  │  Routes to Dispatcher
│  └─────────────┘  │
└────────┬──────────┘
         │
         ▼
┌────────────────────┐
│    Dispatcher      │  (dispatcher.ts)
│                    │
│  1. Match path     │──▶ Registry (route handlers)
│  2. Extract params │
│  3. Call handler   │──▶ ContextRegistry (context objects)
│  4. Build response │──▶ ResponseBuilder
└────────────────────┘
```

### Hot Reload Flow

```
File saved on disk
       │
       ▼
  Transpiler            (transpiler.ts)
  recompiles .ts → .cjs
       │
       ▼
  ModuleLoader          (module-loader.ts)
  clears cache, re-imports module
       │
       ▼
  Registry updated      (registry.ts)
  New handler available immediately
```
