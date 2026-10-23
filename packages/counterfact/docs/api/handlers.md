# Handler arguments

Export one function per HTTP method from a file under `routes/`. The generated `HTTP_GET`, `HTTP_POST`, and related types describe that operation. A handler receives one `$` argument.

| Property        | Type               | Description                                                                             |
| --------------- | ------------------ | --------------------------------------------------------------------------------------- |
| `$.path`        | typed object       | Path parameters from the URL                                                            |
| `$.query`       | typed object       | Query string parameters                                                                 |
| `$.querystring` | typed object       | Entire query string as a single typed object (OpenAPI 3.2 `in: querystring` parameters) |
| `$.headers`     | typed object       | Request headers                                                                         |
| `$.body`        | typed object       | Parsed request body                                                                     |
| `$.context`     | `Context` instance | Shared state for this route subtree                                                     |
| `$.response[N]` | response builder   | Fluent builder for HTTP status code N (e.g. `$.response[200]`, `$.response[404]`)       |

| Member                | Contract                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `$.auth`              | Parsed Basic credentials and supported API-key credentials. This exposes credentials; handlers or middleware implement authorization.  |
| `$.delay(ms, maxMs?)` | Await a fixed delay or a random delay in the supplied range, in milliseconds.                                                          |
| `$.x`                 | The handler argument with widened types, for intentionally out-of-contract behavior. Runtime validation remains separately configured. |

See [custom route handlers](../features/routes.md) for request serialization and authentication examples, and [response builders](./responses.md) for return values.
