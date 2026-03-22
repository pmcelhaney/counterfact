# `src/counterfact-types/` — Exported Type Definitions

This directory contains the TypeScript type definitions that are part of Counterfact's public API. These types are re-exported from the package root and are available to consumers (i.e. code inside a project's `routes/` directory).

## Files

| File | Description |
|---|---|
| `index.ts` | Re-exports all public types: `HttpResponseBuilder`, `HttpTool`, `OpenApiHeader`, and related utility types used by route handler functions |
| `OpenApiHeader.ts` | Defines the `OpenApiHeader` type, which describes a single HTTP response header as modelled in an OpenAPI document |

## Usage

These types are typically imported via the generated type files rather than directly. However, when writing custom middleware or context files that need access to low-level response builder types, you can import from the package root:

```ts
import type { HttpResponseBuilder } from "counterfact";
```
