# Middleware

Place a `_.middleware.ts` file in any `routes/` subdirectory to intercept requests and responses for that subtree. Middleware applies from the root down — a `_.middleware.ts` at the root runs for every request.

```ts
// routes/_.middleware.ts
export async function middleware($, respondTo) {
  const response = await respondTo($);
  return response.header("X-Custom-Header", "Custom Value");
}
```

`respondTo($)` passes the request to the next middleware layer or the route handler, and returns the response. You can modify `$` before calling `respondTo`, modify the response after, or both.

## See also

- [Patterns: Custom Middleware](../patterns/custom-middleware.md) — authentication, headers, and logging across route groups
- [Routes](./routes.md)
- [Reference](../reference.md)
- [Usage](../usage.md)
