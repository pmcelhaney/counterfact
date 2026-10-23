# Proxying and hybrid simulation

You can mix real backend calls with mocks — useful when some endpoints are not finished or you need to test edge cases like 500 errors.

To proxy a single endpoint from within a route file:

```ts
// routes/pet/{petId}.ts
export const GET: HTTP_GET = ($) => {
  return $.proxy("https://uat.petstore.example.com");
};
```

`$.proxy()` appends the full incoming request path to the supplied URL. For
example, a request to `/pet/123` is forwarded to
`https://uat.petstore.example.com/pet/123`.

To set a proxy for the entire API at startup, pass `--proxy-url` on the CLI:

```sh
npx counterfact@latest openapi.yaml api --proxy-url https://uat.petstore.example.com
```

From the REPL, you can toggle proxying for the whole API or specific routes:

```
⬣> .proxy on /payments     # forward /payments to the real API
⬣> .proxy off /payments    # let Counterfact handle /payments
⬣> .proxy off              # disable the root proxy default
```

The REPL toggles use the upstream configured by `--proxy-url` or `.proxy url <url>`.
A path toggle applies to that path and its descendants unless a more specific
toggle overrides it. `.proxy off` changes only the root default; existing
path-specific `on` overrides remain active.

Type `.proxy help` in the REPL for the full list of proxy commands.

## See also

- [Patterns: Hybrid Proxy](../patterns/hybrid-proxy.md) — when to mix real and mocked endpoints
- [REPL](./repl.md) — toggle proxying at runtime
- [Reference](../api.md) — CLI flags
- [Usage](../manual.md)
