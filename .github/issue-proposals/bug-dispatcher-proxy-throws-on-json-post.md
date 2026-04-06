---
title: "Bug: Dispatcher proxy() always throws when request body is present"
parentIssue: 1650
labels:
  - bug
assignees: []
milestone:
---

The `proxy()` helper inside `Dispatcher.request()` is meant to reject non-JSON requests with a helpful error. The guard is:

```ts
if (body !== undefined && headers.contentType !== "application/json") {
  throw new Error(...);
}
```

The problem is `headers.contentType` (camelCase). HTTP headers use kebab-case (`content-type`), and the `headers` object never has a `contentType` key. `headers.contentType` is always `undefined`, so `undefined !== "application/json"` is always `true`.

The entire condition reduces to `body !== undefined`, meaning the proxy throws for **every** request that carries a body — including valid `application/json` POST requests.

## Failing test

Added in `test/server/dispatcher.proxy.test.ts`:

```
does not throw when proxying a POST request with a JSON body and content-type: application/json
```

Run `yarn test` and look for that test name in the `a dispatcher passes a proxy function to the operation` describe block.

## Root cause

```ts
// src/server/dispatcher.ts
if (body !== undefined && headers.contentType !== "application/json") {
  //                             ^^^^^^^^^^^^^ should be headers["content-type"]
```

## Acceptance criteria

- [ ] `headers.contentType` is replaced with `headers["content-type"]`
- [ ] The previously failing test passes
- [ ] The existing proxy test continues to pass
- [ ] A POST request with a non-JSON content type is still rejected with the descriptive error
