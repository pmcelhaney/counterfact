---
"counterfact": minor
---

Add chainable `$.response.cookie()` helper for setting response cookies.

Route handlers can now set one or more cookies without manually building `Set-Cookie` header strings:

```ts
return $.response[200]
  .cookie("sessionId", "abc123", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 3600 })
  .cookie("theme", "dark")
  .json({ ok: true });
```

Supported options: `path`, `domain`, `maxAge`, `expires`, `httpOnly`, `secure`, `sameSite`.
