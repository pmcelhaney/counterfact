# Streaming responses

Use a stream when the client needs to render events or records as they arrive. This lets you test progressive updates and disconnect handling.

Counterfact supports OpenAPI 3.2 sequential media types. When your spec uses `itemSchema` on a `text/event-stream`, `application/jsonl`, or `application/json-seq` content type, the generated handler type expresses the body as `AsyncIterable<T>`.

Use `$.response[<status>].stream(iterable)` to return a stream from any route handler. The content type is inferred automatically from the OpenAPI spec (the first streaming media type defined for that response).

```ts
export const GET: HTTP_GET = ($) => {
  return $.response[200].stream(events());
};

async function* events() {
  yield { id: 1, message: "hello" };
  await new Promise((resolve) => setTimeout(resolve, 500));
  yield { id: 2, message: "world" };
}
```

Each item yielded by the iterable is serialised automatically:

| Content type           | Wire format per item |
| ---------------------- | -------------------- |
| `text/event-stream`    | `data: <json>\n\n`   |
| `application/json-seq` | `\x1e<json>\n`       |
| JSONL / ndjson         | `<json>\n`           |

For `text/event-stream` responses, Counterfact also sets `Cache-Control: no-cache` and `X-Accel-Buffering: no` automatically.

## Named events, reconnects, and heartbeats

Use `.sse(events)` when each item is an SSE frame with `data`, `event`, `id`,
`retry`, or `comment` fields. This selects `text/event-stream` explicitly.
`data` is already serialized text: use `JSON.stringify()` for JSON data.
The existing `.stream()` method continues to JSON-encode each yielded item
inside an SSE `data:` field, including objects with properties named `id` or `data`.

For OpenAPI 3.2, describe the event envelope in `itemSchema`:

```yaml
text/event-stream:
  itemSchema:
    type: object
    properties:
      data: { type: string }
      event: { type: string }
      id: { type: string }
      retry: { type: integer, minimum: 0 }
```

Declare an optional `Last-Event-ID` header parameter on the operation if the
route should resume a feed. For an operation with `operationId: updates`:

```ts
export const GET: updates = ($) => {
  return $.response[200].sse(events($.headers["last-event-id"]));
};

async function* events(lastId?: string) {
  // Comments keep an idle connection active without dispatching a client event.
  yield { comment: "heartbeat" };

  const updates = [
    { id: "1", event: "update", data: JSON.stringify({ progress: 50 }) },
    { id: "2", event: "update", data: JSON.stringify({ progress: 100 }) },
  ];
  const start = updates.findIndex((event) => event.id === lastId) + 1;

  for (const update of updates.slice(start)) {
    yield { ...update, retry: 1000 };
  }
}
```

Counterfact forwards `Last-Event-ID` to the route; the route or its context
owns retention and replay policy. Browser `EventSource` clients reconnect when
an SSE response ends. Return HTTP 204 when the client should stop reconnecting.

Multiline `data` and `comment` values are split into SSE lines. An empty `id`
resets the client's remembered event ID. `retry` must be a nonnegative safe
integer in milliseconds. Event names and IDs cannot contain line breaks, and
IDs cannot contain null characters; invalid frames fail the stream.
A comment-only frame or a frame without `data` does not dispatch a message.
Generate heartbeats at the cadence your simulation needs; Counterfact does not
schedule them automatically. Keep long-running producers cancellable and use
`finally` to clean up resources when the client disconnects.

## Observe the stream

Request the route with `curl -N http://localhost:3100/your-stream-path`, replacing the path with the operation in your specification. Each yielded item should arrive before the iterator finishes. Use the corresponding media type in your OpenAPI response; ordinary JSON bodies do not become incremental streams automatically.

See the [response builder reference](../api/responses.md).
