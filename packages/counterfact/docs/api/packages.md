# Public packages

Use declared package entry points. Each package's README contains public-import examples and its `package.json` declares the supported exports.

| Package / entry point      | Scope                                                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `counterfact`              | `counterfact()` and simulator configuration/lifecycle types; the CLI combines generation, runtime, and REPL. |
| `@counterfact/client`      | Raw HTTP client, route catalog, and immutable request builder.                                               |
| `@counterfact/openapi`     | OpenAPI loading, bundling, dereferencing, and overlays.                                                      |
| `@counterfact/generator`   | TypeScript contracts, editable route scaffolding, scenarios, and templates.                                  |
| `@counterfact/runtime`     | Registries, dispatch contracts, validation, and module loading.                                              |
| `@counterfact/runtime/koa` | Koa HTTP adapter.                                                                                            |
| `@counterfact/runtime/msw` | MSW adapter interfaces.                                                                                      |
| `@counterfact/repl`        | Embeddable REPL.                                                                                             |
| `@counterfact/types`       | Shared contracts for generated code and package integration.                                                 |

## Package-level examples

The [repository package directory](https://github.com/counterfact/api-simulator/tree/main/packages) contains README files and runnable examples for individual packages.

The MSW entry point is an adapter interface. Its existence does not imply that the Node-oriented runtime can be loaded directly into a browser. The standard Counterfact workflow runs a real HTTP server.

For everyday simulator use, start with `counterfact`; use focused packages when embedding individual capabilities.
