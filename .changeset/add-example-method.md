---
"counterfact": patch
---

Add `example(name)` method to response builder for selecting named OpenAPI examples

Developers can now select a specific named example from the OpenAPI specification using the strongly-typed `example()` method on a response builder:

```ts
return $.response[200].example("namedExample1");
```

The method is fully type-safe: TypeScript will autocomplete the example names defined in the OpenAPI document and report a type error if an unknown name is used.

Example names are collected from the `examples` field of each media type in the response content (OpenAPI 3.x). The method can be chained with other response builder methods:

```ts
return $.response[200].example("namedExample1").header("some-header", "some-value");
```
