# Bugs

This file documents potential bugs found in the codebase. Each bug has a
corresponding failing test that demonstrates the incorrect behavior.

---

## Bug 1 — `tools.ts`: `accepts()` ignores lowercase `accept` header

**File:** `src/server/tools.ts`  
**Method:** `Tools.accepts()`  
**Failing test:** `test/server/tools.test.ts` — *"accept('application/json') returns false when lowercase 'accept' header is 'text/plain'"*

### Description

`accepts()` reads the Accept header using `this.headers.Accept` (capital "A").
However, Node.js normalises all incoming HTTP header names to **lowercase**.
When a real HTTP request is processed by Koa and forwarded to `Tools`, the header
is stored under the key `accept`, not `Accept`.

Because `this.headers.Accept` is always `undefined` in production, the early-return
guard `if (acceptHeader === "" || acceptHeader === undefined) { return true; }`
fires unconditionally, making `accepts()` return `true` for every content type
regardless of what the client actually sent.

### Reproduction

```ts
const tools = new Tools({ headers: { accept: "text/plain" } });
tools.accepts("application/json"); // returns true ← BUG (should be false)
```

### Root cause

```ts
// src/server/tools.ts
const acceptHeader = this.headers.Accept; // ← should be this.headers.accept
```

---

## Bug 2 — `tools.ts`: `accepts()` fails when Accept header has spaces after commas

**File:** `src/server/tools.ts`  
**Method:** `Tools.accepts()`  
**Failing test:** `test/server/tools.test.ts` — *"accept('application/json') returns true when Accept header is 'text/html, application/json' (with space)"*

### Description

A well-formed HTTP Accept header commonly separates values with `", "` (comma
followed by a space), e.g. `"text/html, application/json"`.

`accepts()` splits on `","` but does **not** trim whitespace from each part.
This produces the array `["text/html", " application/json"]`.  When the second
element is further split on `"/"`, the type becomes `" application"` (leading
space) instead of `"application"`, so the comparison with the requested content
type always fails.

### Reproduction

```ts
const tools = new Tools({ headers: { Accept: "text/html, application/json" } });
tools.accepts("application/json"); // returns false ← BUG (should be true)
```

### Root cause

```ts
// src/server/tools.ts
const acceptTypes = String(acceptHeader).split(",");
// Each acceptType should be trimmed before splitting on "/"
return acceptTypes.some((acceptType) => {
  const [type, subtype] = acceptType.split("/"); // " application/json" → type = " application"
  ...
});
```

---

## Bug 3 — `dispatcher.ts`: proxy always throws when a request body is present

**File:** `src/server/dispatcher.ts`  
**Location:** `proxy` closure inside `Dispatcher.request()`  
**Failing test:** `test/server/dispatcher.proxy.test.ts` — *"does not throw when proxying a POST request with a JSON body and content-type: application/json"*

### Description

The `proxy()` helper is intended to only forward JSON requests and to throw a
helpful error for other content types.  The guard is:

```ts
if (body !== undefined && headers.contentType !== "application/json") {
  throw new Error(...);
}
```

The problem is `headers.contentType` (camelCase).  HTTP headers use kebab-case
(`content-type`), and Node.js preserves that casing.  The object passed as
`headers` never contains a `contentType` key, so `headers.contentType` is
always `undefined`.

Because `undefined !== "application/json"` is always `true`, the entire
condition reduces to `body !== undefined`.  Any request that carries a body —
including perfectly valid `application/json` POST requests — triggers the error.

### Reproduction

```ts
// POST /a with body { foo: "bar" } and Content-Type: application/json
const response = await dispatcher.request({
  body: { foo: "bar" },
  headers: { "content-type": "application/json" },
  method: "POST",
  path: "/a",
  query: {},
  req: { path: "/a" },
});
// Throws: "$.proxy() is currently limited to application/json requests..."
// ← BUG: should succeed
```

### Root cause

```ts
// src/server/dispatcher.ts
if (body !== undefined && headers.contentType !== "application/json") {
  //                             ^^^^^^^^^^^^^ should be headers["content-type"]
```
