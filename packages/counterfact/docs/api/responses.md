# Response builders

Start with `$.response[status]`, using an HTTP status declared for the operation. Chain body and header methods and return the result from the handler.

`$.response[N]` (where N is the HTTP status code) returns a fluent builder. Chain one or more of these methods:

| Method                           | Description                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `.random()`                      | Random data generated from the OpenAPI schema (uses `examples` where available) |
| `.example(name)`                 | A specific named example from the OpenAPI spec                                  |
| `.empty()`                       | Explicitly returns a response with no body (use for 204 No Content and similar) |
| `.json(content)`                 | JSON body (also converts to XML automatically when the client requests it)      |
| `.text(content)`                 | Plain-text body                                                                 |
| `.html(content)`                 | HTML body                                                                       |
| `.xml(content)`                  | XML body                                                                        |
| `.match(contentType, content)`   | Body with an explicit content type; chain multiple for content negotiation      |
| `.header(name, value)`           | Adds a response header                                                          |
| `.cookie(name, value, options?)` | Adds a `Set-Cookie` header                                                      |

```ts
return $.response[200]
  .header("x-request-id", "abc123")
  .cookie("session", "xyz", { httpOnly: true })
  .json({ ok: true });
```

## Streaming

`.stream(iterable)` accepts an async iterable. The response's OpenAPI streaming media type determines serialization. Supported formats include SSE, JSONL/ndjson, and JSON sequences. See [streaming responses](../manual/streaming.md).

## Content negotiation

Chain `.match(contentType, content)` to offer explicit representations. An unsupported `Accept` header can produce a 406 response. A 406 response may be plain text; inspect its content type before decoding it.

## Cookies

`.cookie(name, value, options?)` appends `Set-Cookie`. Options are `path`, `domain`, `maxAge` (seconds), `expires` (Date), `httpOnly`, `secure`, and `sameSite` (`lax`, `strict`, or `none`).
