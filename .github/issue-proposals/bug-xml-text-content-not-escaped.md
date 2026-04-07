---
title: "Bug: XML text content is not escaped in json-to-xml.ts"
parentIssue: 1692
labels:
  - bug
assignees: []
milestone:
---

In `src/server/json-to-xml.ts`, the `jsonToXml` function correctly escapes attribute values using `xmlEscape()`, but omits escaping for plain text content (the fallback branch that handles primitive values such as strings, numbers, and booleans):

```ts
// src/server/json-to-xml.ts  line 89
return `<${name}>${String(json)}</${name}>`;
```

If `json` is a string that contains XML special characters — `<`, `>`, `&`, `'`, or `"` — the output will be malformed XML. For example:

```ts
jsonToXml('<script>alert("xss")</script>', undefined, "item")
// → <item><script>alert("xss")</script></item>   ← invalid XML
```

The file already defines `xmlEscape()` and uses it for attribute values (line 57). The fix is to apply the same function to text content:

```ts
return `<${name}>${xmlEscape(String(json))}</${name}>`;
```

## Acceptance criteria

- [ ] `xmlEscape()` is applied to primitive text values in the final return of `jsonToXml`
- [ ] A unit test confirms that strings containing `<`, `>`, `&`, `'`, and `"` are correctly escaped in element text content
- [ ] Attribute values (already escaped) continue to pass their existing tests
- [ ] Existing XML generation tests continue to pass
