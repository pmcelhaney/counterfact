# `src/client/` — Built-in UI Templates

This directory contains [Handlebars](https://handlebarsjs.com/) (`.hbs`) templates that are rendered by `page-middleware.ts` to produce the browser-facing pages bundled with Counterfact.

## Files

| File | Description |
|---|---|
| `index.html.hbs` | Template for the Counterfact dashboard (`/counterfact/`); lists registered routes and shows server status |
| `rapi-doc.html.hbs` | Template for the interactive API documentation page (`/counterfact/swagger/`); embeds the [RapiDoc](https://rapidocweb.com/) viewer and adds VSCode "open file" links |

## How It Works

When a request arrives for `/counterfact/` or `/counterfact/swagger/`, `page-middleware.ts` compiles the appropriate template with runtime data (routes, port, base path, etc.) and sends the resulting HTML to the browser. No build step is required; templates are rendered on the fly.
