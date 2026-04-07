---
title: "Bug: Deprecated unescape() function used in requirement.ts"
parentIssue: 1692
labels:
  - bug
assignees: []
milestone:
---

`src/typescript-generator/requirement.ts` uses the deprecated global `unescape()` function to decode percent-encoded characters in JSON Pointer path segments:

```ts
// src/typescript-generator/requirement.ts  line 64
.map(unescape);
```

`unescape` has been deprecated since ECMAScript 3. It was retained for backwards compatibility but may be removed in a future JavaScript/Node.js runtime. The recommended replacement is `decodeURIComponent`, which handles standard percent-encoded sequences (`%XX`) and is well-defined in the spec.

The comment above this line acknowledges the situation:
> "Technically we should not be unescaping, but it came up in https://github.com/pmcelhaney/counterfact/issues/1083 and I can't think of a reason anyone would intentionally put a % in a key name."

One behavioral difference: `unescape` also handles the non-standard `%uXXXX` syntax; `decodeURIComponent` does not and will throw a `URIError` for such sequences. The safe replacement wraps the call:

```ts
.map((part) => {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
})
```

## Acceptance criteria

- [ ] The call to the deprecated `unescape()` is replaced with `decodeURIComponent()` wrapped in a try/catch
- [ ] A test confirms that a path segment like `%20my%20key` is decoded to `" my key"` when selecting into a requirement
- [ ] Existing tests continue to pass
