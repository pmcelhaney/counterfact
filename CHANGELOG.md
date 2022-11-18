# counterfact

## 0.13.2

### Patch Changes

- 8f472c9: change the way JSONSchemaFaker is imported to avoid CJS -> ESM issues

## 0.13.1

### Patch Changes

- 30baae9: a couple of fixes to improve OpenAPI 2 support
- b212793: use OpenAPI to convert strings in path/query/header to numbers at runtime

## 0.13.0

### Minor Changes

- e141c46: Experimental support for OpenAPI 2

## 0.12.0

### Minor Changes

- 1a622d2: a REPL allows you to interact with the server's context programatically

## 0.11.0

### Minor Changes

- 5a7e12b: --open opens the browser to a landing page with pointers to the code, Swagger, and the docs

## 0.10.3

### Patch Changes

- f1360ba: made the generated code a bit cleaner

## 0.10.2

### Patch Changes

- d8cbc41: fix swagger-ui when the openapi doc has a host property
- d8cbc41: ensure a $context.ts file is created in every directory
- 15270ed: remove dead code in operation-coder.js
- c7a928f: encode non-alphanumeric name as valid variable names

## 0.10.1

### Patch Changes

- 02efcd5: fix so that Counterfact no longer depends on itself

## 0.10.0

### Minor Changes

- 7e6028c: reworked CLI: generate code then optionally start the server, Swagger UI, open a browser

### Patch Changes

- Updated dependencies [7e6028c]
  - counterfact@0.10.0

## 0.9.0

### Minor Changes

- 88ed486: new $context.ts files which are used to define the server context / state

### Patch Changes

- Updated dependencies [88ed486]
  - counterfact@0.9.0

## 0.8.0

### Minor Changes

- 920504a: when encoding JSON schema in TypeScript, mark object properties as optional unless they are required
- 92dc769: the open API document can now be loaded from a URL rather than a local path
- ed44ba4: fix so that response[statusCode].random() can use the OpenAPI spec
- 5a767e7: the generated code for a path now uses response[statusCode].random() instead of a bunch of ugly boilerplate

### Patch Changes

- a1de4c0: add headers to the generated response type
- 86c1412: fix an issue where random() wasn't reading the examples right
- Updated dependencies [a1de4c0]
- Updated dependencies [920504a]
- Updated dependencies [86c1412]
- Updated dependencies [92dc769]
- Updated dependencies [ed44ba4]
- Updated dependencies [5a767e7]
  - counterfact@0.8.0

## 0.7.0

### Minor Changes

- 4f3c7c9: define a ResponseBuilder type -- to be refined later with one or more generic arguments
- 5f3ee3f: response builder fluent API which is going to make intellisense with TypeScript awesome
- 6221e7d: `counterfact start` command to start a server
- a3dfb48: `npm counterfact init <openapi-file> <destination>` command to build a new package with a Counterfact server
- 9f91d57: adds a 'go' command that generates code and starts the server in one step
- 25dcd45: ability to respond with multiple content types, return the best match for the request's accept header
- c84a4f4: Counterfact is now able to read an OpenAPI document and use it to generate a random response.
- c0cb938: a function can now return "hello world" as shorthand for `{status: 200, contentType: "text/plain", body: "hello world"}`

### Patch Changes

- 69b4598: replaced EventEmitter with EventTarget
- a07c2b2: fix a crash when regenerating code
- 85c3349: fixed an issue where hot reload did not work in some cases
- 1551cbb: handle additionalProperties when converting a JSON Schema to TypeScript

## 0.6.0

### Minor Changes

- 9161d80: Setup basic devcontainer.

### Patch Changes

- 6d01563: fixed the generate script in the main package (yarn generate wasn't doing anything)
- 6f406c4: fixed an issue where the generated JSON schema was changing integer types to number
- 6f406c4: fixed an issue where a response with no content was blowing up

## 0.5.0

### Minor Changes

- 5e72a6c: CLI to generate TypeScript files
- de5e92b: use example values (if present) when generating random data

## 0.4.0

### Minor Changes

- ab38cb2: add a tools.randomFromSchema(schema: JSONSchema) function

## 0.3.0

### Minor Changes

- 406b907: Add a tools object that will be provided to the request

## 0.2.0

### Minor Changes

- 741e4fe: change path parameters from [this] to {this} for consistency with OpenAPI
- f237c38: proof of concept specifying routes with TypeScript and ts-node

### Patch Changes

- 420cd52: return a 404 with a helpful error message when a handler for a route does not exist
- c11a475: allow the intial context (nee "store") to be passed as the second argument to `counterfact()`

## 0.1.2

### Patch Changes

- 3829a83: fix changeset access configuration (https://github.com/changesets/changesets/issues/503)

## 0.1.1

### Patch Changes

- 4c2bad8: build: add npm token to the release workflow

## 0.1.0

### Minor Changes

- 719d932: support for HTTP response code
- a5cd8d4: Filled out missing properties in package.json.
  - Deleted the original index.js file that does nothing.
  - This is the first release that's actually usable.

### Patch Changes

- 6101623: Update the demo app to work with recent API changes
- 95f3ca2: no changes -- just trying to get a Github action to run
