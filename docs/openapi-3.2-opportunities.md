# OpenAPI 3.2 — Opportunities for Counterfact

OpenAPI 3.2 was released in early 2025. This document identifies changes in the specification and maps each one to a concrete opportunity for Counterfact to adopt it so that Counterfact can be listed as an OpenAPI 3.2 early adopter on [OpenAPI.tools](https://openapi.tools).

The opportunities are grouped by theme and rated by **impact** (how much value it adds to Counterfact users) and **effort** (how much work is required to implement it).

---

## 1. New and Extended HTTP Methods

### 1a. Native `QUERY` method

OpenAPI 3.2 formally adds `query` as a first-class HTTP method alongside `get`, `post`, `put`, `delete`, `options`, `head`, `patch`, and `trace`. The [QUERY method](https://www.ietf.org/archive/id/draft-ietf-httpbis-safe-method-w-body-02.html) is safe and idempotent but allows a request body, making it useful for complex search/filter operations.

**Current state:** `HttpMethods` in `src/server/registry.ts` and `HTTP_METHODS` in `src/migrate/update-route-types.ts` do not include `QUERY`. The Koa layer, dispatcher, and migration helper would all need updating.

**Opportunity:** Add `"QUERY"` to `HttpMethods`, `ALL_HTTP_METHODS`, and the migration helper's `HTTP_METHODS` list. The code generator already iterates over all keys in a path definition, so generation would work automatically once the server recognises the method.

**Impact:** Medium — Enables mock servers for APIs that use the QUERY method  
**Effort:** Low — Small, mechanical additions to a handful of files

### 1b. Arbitrary methods via `additionalOperations`

For HTTP methods that do not have a dedicated field in the Path Item Object (e.g. `LINK`, `UNLINK`, `LOCK`), OpenAPI 3.2 introduces an `additionalOperations` key. Values are Operation Objects keyed by the method name in its correct capitalisation.

**Current state:** The generator in `src/typescript-generator/generate.ts` iterates over all top-level keys in each path item, so keys like `get`, `post`, etc. are processed automatically. However, `additionalOperations` is a *nested* object and would not be unwrapped by the current loop; those operations would be silently ignored.

**Opportunity:** Detect the `additionalOperations` key during code generation and flatten its entries into the same processing loop. The server layer would also need to forward requests with custom method names to the matching handler.

**Impact:** Low–Medium — Niche use cases but required for full 3.2 compliance  
**Effort:** Medium — Requires changes to the generator loop and the Koa/dispatcher layer

---

## 2. Streaming and Sequential Media Types

OpenAPI 3.2 introduces first-class support for streaming responses via sequential media types such as `text/event-stream` (Server-Sent Events), `multipart/mixed`, `application/jsonl`, and `application/json-seq`. A new `itemSchema` field in the Media Type Object describes the schema of each individual item in the stream, while responses are conceptually treated as arrays of schema instances.

**Current state:** Counterfact generates typed response builders and can return example data from the spec, but has no concept of streaming or server-sent events. The `text/event-stream` content type is not specially handled.

**Opportunity:**

- Recognise `itemSchema` in `src/typescript-generator/schema-type-coder.ts` / `src/typescript-generator/response-type-coder.ts` and generate `Array<T>` types for it.
- In the server layer, when a request accepts `text/event-stream`, send an SSE-formatted response (using Node.js streams) instead of a one-shot JSON body.
- Expose a helper on the `$` argument (similar to `$.proxy`) that allows route handlers to push events to a stream.

**Impact:** High — SSE is widely used in modern APIs (AI/LLM streaming, real-time dashboards)  
**Effort:** High — Requires new server streaming infrastructure and type-generation changes

---

## 3. `querystring` Parameter Location

OpenAPI 3.2 adds `querystring` as a new value for the `in` field of a Parameter Object. Unlike the existing `query` (which targets a single named query parameter), `querystring` treats the entire query string as a single field and allows it to be parsed with a schema, similar to how `requestBody` works for request bodies.

**Current state:** `src/typescript-generator/parameters-type-coder.ts` generates typed objects for `query`, `path`, `header`, and `cookie` parameters. A `querystring` parameter would be ignored.

**Opportunity:** Handle `in: querystring` in `ParametersTypeCoder` and in the dispatcher's parameter-extraction logic. Generate a typed `querystring` property on the `$` argument.

**Impact:** Medium — Simplifies complex query-string APIs (e.g. OData, OpenSearch)  
**Effort:** Medium — Requires changes to both the type generator and the server dispatcher

---

## 4. Example Object — `dataValue` and `serializedValue`

The Example Object gains two new fields:

- `dataValue` — the example expressed as a structured (parsed) value, analogous to the existing `value` field.
- `serializedValue` — the example as it would appear on the wire, as a string.

The existing `externalValue` is now explicitly documented as a serialized value.

**Current state:** Counterfact's random-response logic reads the `value` field from Example Objects when returning example responses.

**Opportunity:**

- Prefer `dataValue` over `value` when generating example responses so that structured data is used correctly.
- Optionally support `serializedValue` for content types where the wire format differs from the parsed form (e.g. `application/x-www-form-urlencoded`).

**Impact:** Medium — Improves correctness of example responses for APIs that use the new fields  
**Effort:** Low — A small change in the response-building / example-selection logic

---

## 5. Discriminator Improvements

### 5a. Optional `propertyName`

The `discriminator.propertyName` field is now optional. When absent, a `defaultMapping` (see below) must be provided.

**Current state:** `SchemaTypeCoder.writeGroup()` relies on `allOf`/`anyOf`/`oneOf` without inspecting the `discriminator` object; `propertyName` being absent would not cause an error but the generated union type would be unchanged.

**Opportunity:** No immediate breaking change; ensure that the absence of `propertyName` does not cause a runtime error during type generation.

**Impact:** Low  
**Effort:** Low — Defensive null-check only

### 5b. `defaultMapping`

A new `defaultMapping` field on the Discriminator Object specifies which schema to use when `propertyName` is absent or the value is not found in `mapping`.

**Opportunity:** Use `defaultMapping` in `SchemaTypeCoder` to emit a more accurate union type when generating TypeScript, including the default variant.

**Impact:** Low–Medium — Improves accuracy of generated types for polymorphic schemas  
**Effort:** Low — Small addition to `SchemaTypeCoder.writeGroup()`

---

## 6. Tag Enhancements

Tags gain three new fields:

- `summary` — a short title for the tag, used in lists.
- `parent` — points to a parent tag to support nested grouping.
- `kind` — classifies the tag (e.g. `nav`, `audience`). A [public registry](https://spec.openapis.org/registry/tag-kind/index.html) defines conventional values.

**Current state:** Counterfact does not currently process or display tag metadata.

**Opportunity:** The built-in dashboard / Swagger UI page (`src/client/`) could use `summary`, `parent`, and `kind` to render a hierarchical navigation tree, grouping operations by nested tags. This would be particularly valuable for large APIs.

**Impact:** Medium — Improves discoverability in the built-in UI for large APIs  
**Effort:** Medium — Frontend work in the Handlebars/Vue layer

---

## 7. Response Object Changes

### 7a. `description` is now optional

Previously, the Response Object required `description`. In 3.2 it is optional.

**Current state:** The generator does not validate or use `description`. Missing descriptions would not cause an error in the current code.

**Opportunity:** No code changes needed; confirm in the test suite that an operation with responses that have no `description` is handled gracefully.

**Impact:** Low — Correctness / robustness improvement  
**Effort:** Very Low — Add a test case

### 7b. New `summary` field on responses

A short `summary` field is now supported alongside `description` on Response Objects.

**Opportunity:** Surface `summary` in the built-in API-testing UI (`src/client/api-tester.html.hbs`) as a tooltip or label when listing available response codes.

**Impact:** Low — Minor UX improvement  
**Effort:** Low

---

## 8. Security Scheme Updates

### 8a. OAuth2 Device Authorization flow

The OAuth2 Security Scheme Flows Object gains a `deviceAuthorization` entry with a `deviceAuthorizationUrl` field (per [RFC 8628](https://datatracker.ietf.org/doc/html/rfc8628)).

**Current state:** Counterfact's `OperationTypeCoder` checks for `type === "http" && scheme === "basic"` to determine the `user` type on the `$` argument. Other flows are not specially handled.

**Opportunity:** Recognise `deviceAuthorization` flow in `OperationTypeCoder` so that the generated handler type includes the correct credential shape for device-flow tokens.

**Impact:** Low–Medium — Niche but growing use case (CLI tools, smart TVs)  
**Effort:** Low

### 8b. `oauth2MetadataUrl`

A new top-level field on the OAuth2 Security Scheme provides the URL of the authorisation server's metadata document (per [RFC 8414](https://datatracker.ietf.org/doc/html/rfc8414)).

**Opportunity:** Display this URL in the built-in dashboard to help developers configure OAuth2 clients against the mock server.

**Impact:** Low  
**Effort:** Low

### 8c. `deprecated` on security schemes

Security schemes can now be marked `deprecated: true`.

**Opportunity:** Emit a TypeScript `@deprecated` JSDoc comment in the generated handler types when the security scheme used by an operation is deprecated.

**Impact:** Low — Surfaces specification intent to developers as a compiler warning  
**Effort:** Low

---

## 9. `$self` — Document Identity and URL Resolution

A new top-level `$self` field allows an OpenAPI document to declare its own canonical URI, which is used as the base when resolving relative `$ref` values.

**Current state:** Counterfact uses `@apidevtools/json-schema-ref-parser` for bundling, which already handles base-URI resolution. The `$self` field would be passed through.

**Opportunity:** Ensure that the spec loader in `src/typescript-generator/specification.ts` and `src/server/openapi-middleware.ts` does not strip or misinterpret `$self` when bundling. Add a test with a spec that uses `$self` to verify correct `$ref` resolution.

**Impact:** Low — Mainly a correctness/robustness guarantee  
**Effort:** Very Low — Likely already works; add a regression test

---

## 10. `mediaTypes` Component

A new `mediaTypes` key is supported under `components` to allow reuse of Media Type Objects (similar to how `schemas`, `responses`, `parameters`, and `examples` are reused today).

**Current state:** `src/typescript-generator/generate.ts` only reads `#/paths` and `#/components/securitySchemes`. Other component types are resolved via `$ref` by the bundler.

**Opportunity:** Ensure that `$ref` values pointing to `#/components/mediaTypes/...` are resolved correctly at both code-generation time and at runtime. The bundler likely handles this automatically; add a test to confirm.

**Impact:** Low — Reuse of media type definitions is a DX improvement for API designers  
**Effort:** Very Low — Likely already works via `$ref` bundling; add a test

---

## 11. XML `nodeType` Field

A new `nodeType` field on the XML Object maps a schema to an XML node type: `element`, `attribute`, `text`, `cdata`, or `none`. `attribute: true` is deprecated in favour of `nodeType: attribute`, and `wrapped: true` is deprecated in favour of `nodeType: element`.

**Current state:** Counterfact has a `src/server/json-to-xml.ts` helper for XML serialisation, but it is not clear how much of the XML Object is currently supported.

**Opportunity:** Update `json-to-xml.ts` to understand `nodeType` and treat the deprecated `attribute: true` / `wrapped: true` fields as synonyms during the transition period.

**Impact:** Low — Relevant only to XML-based APIs  
**Effort:** Medium — Requires understanding and updating the XML serialisation logic

---

## 12. Server Object `name` Field

The Server Object gains a `name` field alongside the existing `description`, `url`, and `variables` fields.

**Current state:** `src/server/openapi-middleware.ts` injects a `Counterfact` server entry with only `description` and `url`.

**Opportunity:** Set `name: "Counterfact"` in the injected server entry so that tools that display `name` (including OpenAPI 3.2-aware UIs) render it correctly.

**Impact:** Low — Minor UX improvement in Swagger UI and similar tools  
**Effort:** Very Low — One-line change in `openapi-middleware.ts`

---

## 13. JSON Schema Alignment

OpenAPI 3.2 updates its embedded JSON Schema reference to [draft-bhutton-json-schema-01](https://www.ietf.org/archive/id/draft-bhutton-json-schema-01.html) and [draft-bhutton-json-schema-validation-01](https://www.ietf.org/archive/id/draft-bhutton-json-schema-validation-01.html).

**Current state:** Counterfact uses `json-schema-faker` for generating random values from schemas. The library's supported draft determines what schema keywords are available.

**Opportunity:** Verify that `json-schema-faker` supports the keywords introduced in `draft-bhutton-json-schema-01` (notably the revised `unevaluatedProperties`, `unevaluatedItems`, and `prefixItems`). Upgrade the library or add workarounds as necessary.

**Impact:** Medium — Affects correctness of random response generation  
**Effort:** Low–Medium — Depends on the library's current support level

---

## Summary Table

| Opportunity | Impact | Effort | Files Affected |
|---|---|---|---|
| 1a. `QUERY` HTTP method | Medium | Low | `registry.ts`, `update-route-types.ts`, `koa-middleware.ts` |
| 1b. `additionalOperations` | Low–Medium | Medium | `generate.ts`, `dispatcher.ts`, `registry.ts` |
| 2. Streaming / SSE (`itemSchema`) | High | High | `response-type-coder.ts`, `schema-type-coder.ts`, `koa-middleware.ts`, new streaming helper |
| 3. `querystring` parameter | Medium | Medium | `parameters-type-coder.ts`, `dispatcher.ts` |
| 4. `dataValue`/`serializedValue` examples | Medium | Low | Response/example selection logic |
| 5a. Optional discriminator `propertyName` | Low | Low | `schema-type-coder.ts` |
| 5b. Discriminator `defaultMapping` | Low–Medium | Low | `schema-type-coder.ts` |
| 6. Tag `summary`/`parent`/`kind` | Medium | Medium | `src/client/` templates |
| 7a. Optional response `description` | Low | Very Low | Test only |
| 7b. Response `summary` | Low | Low | `src/client/api-tester.html.hbs` |
| 8a. OAuth2 Device Authorization flow | Low–Medium | Low | `operation-type-coder.ts` |
| 8b. `oauth2MetadataUrl` | Low | Low | `src/client/` templates |
| 8c. `deprecated` security scheme | Low | Low | `operation-type-coder.ts` |
| 9. `$self` document identity | Low | Very Low | Test only |
| 10. `mediaTypes` component | Low | Very Low | Test only |
| 11. XML `nodeType` | Low | Medium | `json-to-xml.ts` |
| 12. Server `name` field | Low | Very Low | `openapi-middleware.ts` |
| 13. JSON Schema alignment | Medium | Low–Medium | `json-schema-faker` usage |

---

## Recommended Starting Points

If the goal is to be listed as an **early adopter** with minimal investment, the highest-return items are:

1. **`QUERY` HTTP method (1a)** — High visibility, low effort, clearly demonstrates 3.2 awareness.
2. **`dataValue`/`serializedValue` examples (4)** — Simple change with user-visible impact on example responses.
3. **Server `name` field (12)** — Trivial change that shows up in every OpenAPI-aware UI.
4. **Streaming / SSE (2)** — High user demand; worth investing in even though it requires more work.
5. **`querystring` parameter (3)** — Useful for complex search/filter APIs; moderate effort.

---

## Creating GitHub Issues

Run the following script to open one GitHub issue per opportunity (requires the `gh` CLI and `repo` scope):

```sh
#!/usr/bin/env bash
set -euo pipefail
DOCS="docs/openapi-3.2-opportunities.md"
PARENT=1566  # parent issue: "Support for OpenAPI 3.2"

gh issue create \
  --title "OpenAPI 3.2: Add support for QUERY HTTP method" \
  --body "OpenAPI 3.2 formally adds \`query\` as a first-class HTTP method. \`HttpMethods\` in \`src/server/registry.ts\` and \`HTTP_METHODS\` in \`src/migrate/update-route-types.ts\` do not include \`QUERY\`. The Koa layer, dispatcher, and migration helper all need updating.\n\n**Impact:** Medium | **Effort:** Low\n\nSee [$DOCS](../../blob/main/$DOCS#1a-native-query-method) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Support additionalOperations for arbitrary HTTP methods" \
  --body "OpenAPI 3.2 introduces an \`additionalOperations\` key in Path Item Objects for HTTP methods that have no dedicated field (e.g. \`LINK\`, \`UNLINK\`). The generator in \`src/typescript-generator/generate.ts\` would silently ignore them.\n\n**Impact:** Low–Medium | **Effort:** Medium\n\nSee [$DOCS](../../blob/main/$DOCS#1b-arbitrary-methods-via-additionaloperations) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Streaming / SSE support via itemSchema" \
  --body "OpenAPI 3.2 introduces first-class support for streaming responses (\`text/event-stream\`, \`application/jsonl\`, etc.) with a new \`itemSchema\` field. Counterfact currently has no concept of streaming or SSE.\n\nChanges needed in \`src/typescript-generator/response-type-coder.ts\`, \`schema-type-coder.ts\`, and the Koa middleware layer.\n\n**Impact:** High | **Effort:** High\n\nSee [$DOCS](../../blob/main/$DOCS#2-streaming-and-sequential-media-types) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Support querystring parameter location" \
  --body "OpenAPI 3.2 adds \`querystring\` as a new value for the \`in\` field of a Parameter Object, treating the entire query string as a single schema-described field. \`ParametersTypeCoder\` and the dispatcher both need updating.\n\n**Impact:** Medium | **Effort:** Medium\n\nSee [$DOCS](../../blob/main/$DOCS#3-querystring-parameter-location) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Recognise dataValue and serializedValue in Example Objects" \
  --body "OpenAPI 3.2 adds \`dataValue\` (structured) and \`serializedValue\` (wire-format string) to the Example Object. Counterfact currently reads only the \`value\` field when returning example responses.\n\nPrefer \`dataValue\` over \`value\` in the response-building / example-selection logic.\n\n**Impact:** Medium | **Effort:** Low\n\nSee [$DOCS](../../blob/main/$DOCS#4-example-object--datavalue-and-serializedvalue) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Handle optional discriminator propertyName and defaultMapping" \
  --body "OpenAPI 3.2 makes \`discriminator.propertyName\` optional and adds a \`defaultMapping\` field. \`SchemaTypeCoder.writeGroup()\` needs a defensive null-check and should use \`defaultMapping\` when generating union types.\n\n**Impact:** Low–Medium | **Effort:** Low\n\nSee [$DOCS](../../blob/main/$DOCS#5-discriminator-improvements) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Use tag summary/parent/kind for hierarchical navigation in the UI" \
  --body "OpenAPI 3.2 adds \`summary\`, \`parent\`, and \`kind\` fields to the Tag Object. The built-in dashboard (\`src/client/\`) could render a hierarchical navigation tree using these fields.\n\n**Impact:** Medium | **Effort:** Medium\n\nSee [$DOCS](../../blob/main/$DOCS#6-tag-enhancements) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Handle optional response description and new summary field" \
  --body "OpenAPI 3.2 makes \`description\` optional on Response Objects and adds a \`summary\` field. A test should confirm that missing \`description\` is handled gracefully. The \`summary\` field can be surfaced in the API-testing UI (\`src/client/api-tester.html.hbs\`).\n\n**Impact:** Low | **Effort:** Very Low\n\nSee [$DOCS](../../blob/main/$DOCS#7-response-object-changes) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Support OAuth2 Device Authorization flow, oauth2MetadataUrl, and deprecated security schemes" \
  --body "OpenAPI 3.2 updates OAuth2 security schemes with a \`deviceAuthorization\` flow, a top-level \`oauth2MetadataUrl\`, and a \`deprecated\` flag. \`OperationTypeCoder\` should recognise the device flow, and deprecated schemes should emit \`@deprecated\` JSDoc in generated types.\n\n**Impact:** Low–Medium | **Effort:** Low\n\nSee [$DOCS](../../blob/main/$DOCS#8-security-scheme-updates) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Verify \$self document identity and URL resolution" \
  --body "OpenAPI 3.2 adds a top-level \`\$self\` field for canonical document URI. Counterfact uses \`@apidevtools/json-schema-ref-parser\` which likely handles it already, but a regression test with a spec using \`\$self\` should be added.\n\n**Impact:** Low | **Effort:** Very Low\n\nSee [$DOCS](../../blob/main/$DOCS#9-self--document-identity-and-url-resolution) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Verify \$ref resolution for components/mediaTypes" \
  --body "OpenAPI 3.2 adds a \`mediaTypes\` key under \`components\` for reusable Media Type Objects. The bundler likely resolves these \`\$ref\`s already; add a test to confirm.\n\n**Impact:** Low | **Effort:** Very Low\n\nSee [$DOCS](../../blob/main/$DOCS#10-mediatypes-component) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Support XML nodeType field in json-to-xml serialisation" \
  --body "OpenAPI 3.2 adds \`nodeType\` to the XML Object (\`element\`, \`attribute\`, \`text\`, \`cdata\`, \`none\`), deprecating \`attribute: true\` and \`wrapped: true\`. \`src/server/json-to-xml.ts\` needs to be updated.\n\n**Impact:** Low | **Effort:** Medium\n\nSee [$DOCS](../../blob/main/$DOCS#11-xml-nodetype-field) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Add name field to injected Counterfact server entry" \
  --body "OpenAPI 3.2 adds a \`name\` field to the Server Object. \`src/server/openapi-middleware.ts\` injects a server entry with only \`description\` and \`url\`; adding \`name: \"Counterfact\"\` is a one-line change.\n\n**Impact:** Low | **Effort:** Very Low\n\nSee [$DOCS](../../blob/main/$DOCS#12-server-object-name-field) for full details.\n\nParent: #$PARENT"

gh issue create \
  --title "OpenAPI 3.2: Verify json-schema-faker alignment with draft-bhutton-json-schema-01" \
  --body "OpenAPI 3.2 updates its JSON Schema reference to \`draft-bhutton-json-schema-01\`. Verify that \`json-schema-faker\` supports the revised keywords (\`unevaluatedProperties\`, \`unevaluatedItems\`, \`prefixItems\`) and upgrade or add workarounds as necessary.\n\n**Impact:** Medium | **Effort:** Low–Medium\n\nSee [$DOCS](../../blob/main/$DOCS#13-json-schema-alignment) for full details.\n\nParent: #$PARENT"
```
