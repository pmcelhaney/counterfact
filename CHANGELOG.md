# counterfact

## 0.36.0

### Minor Changes

- 6460017: minor breaking change: `$.context.ts` is now `_.context.ts` and exports a class named Context

  See https://github.com/pmcelhaney/counterfact/blob/main/docs/context-change.md

### Patch Changes

- 8f028d5: CodeGenerator#watch() now waits until Chokidar completes its initial scan before resolving

## 0.35.0

### Minor Changes

- 479da6b: transpile TypeScript code to ES2022
- 8ab35b9: emit either CommonJS or ESM files depending on whether there's a package.json with type: module

  This change makes it possible to create modules that are imported into files in the paths directory.

## 0.34.2

### Patch Changes

- 0610da9: Fix issue 703: Endpoint with trailing slash

## 0.34.1

### Patch Changes

- c000cfc: Fixed: a handler function (GET(), PUT(), etc) should always return a response, even if that response is just a status code. If the handler doesn't return, the server will response with a 500 error.
- 4cdcb2d: fix: the optional flag for a parameter was inside quotes, making it part of the name rather than TypeScript syntax

## 0.34.0

### Minor Changes

- 47374ee: Partial support for XML (if anyone still uses XML). See https://swagger.io/docs/specification/data-models/representing-xml/
- 2366b50: Removed link to the dashboard / admin console because it's not really useful yet.
- 5c6cce9: Until now the dashboard hasn't gotten much attention. Added a logo and took some baby steps toward the planned design. https://excalidraw.com/#json=THGkyuKCGr_69fFqUrghd,ecIPAvDtoAOajwZ9G4m3sg

### Patch Changes

- 5c6cce9: fix links to open in VSCode

## 0.33.0

### Minor Changes

- 93d7607: added a 🤖 to the prompt to make it look more distinguished
- 960105a: just for fun, the tagline when the CLI starts is different every time you run it

### Patch Changes

- cf203d7: ignore the HTTP accept header if the response has no body

## 0.32.0

### Minor Changes

- 25933c2: fix an issue where the types.d.ts file was not copied over

## 0.31.0

### Minor Changes

- 24d96c3: created a new intro banner for the CLI

### Patch Changes

- 88cebcd: fixed an issue where if there was a directory and file with the same name, one would shadow the other

## 0.30.0

### Minor Changes

- 0dc11ea: added a --prefix option to specify prefix from which routes are served (e.g. /api/v1)

### Patch Changes

- 4de94f0: Update dependency @types/jest to v29.5.7
- 5f8e97b: chore(deps): update dependency @types/jest to v29.5.8

## 0.29.0

### Minor Changes

- 0069e9b: The list of routes on on the dashboard (http://localhost:3100/counterfact) is now determined on the fly
- 0069e9b: Regenerate code if the OpenAPI file changes while Counterfact is running
- f89691a: configure json-schema-faker to create between 0 and 20 items when it generates an array

## 0.28.0

### Minor Changes

- 33d05f9: configure json-schema-aker to create between 0 and 20 items when it generates an array

## 0.27.1

### Patch Changes

- 7eba726: got a little carried away with typeof; it's needed for the instance, not the class

## 0.27.0

### Minor Changes

- 836b61d: Fixed an issue where the context object wasn't working as expected.

  BREAKING CHANGE:

  - the main $.context.ts file needs an extra line: `export type ContextType = Context;`
  - $.context.ts files below the root need to change to `export type { ContextType } from "../$.context";`
  - if you modified any of the $.context.ts files below the root, treat the first bullet applies

  When you run Counterfact, it will try to make these changes for you, so ideally you won't have to worry about it.

## 0.26.3

### Patch Changes

- 5f02963: Fixes issue #593 where custom response headers were not being set

## 0.26.2

### Patch Changes

- 9d7bc5c: Fixes issue #585 where dispatcher.ts needs to use the matchedPath when calling the contextRegistry.find method

## 0.26.1

### Patch Changes

- dd0aecb: remove postinstall script that was preventing counterfact from installing

## 0.26.0

### Minor Changes

- 61ba2c9: the server code has been converted to TypeScript -- let me know if something stopped working
- 28d21f8: put generated JS code under a .cache directory and add that directory to .gitignore
- 61ba2c9: fix for OpenAPI 3 examples, which weren't read correctly (hardly anyone uses them)

## 0.25.5

### Patch Changes

- 8d86f34: make paths in URLs case-insensitive (http://localhost:3100/FOO is the same as http://localhost:3100/foo)
- f60874f: fix a few edge cases found when running against Github's extensive OpenAPI description: https://github.com/github/rest-api-description

## 0.25.4

### Patch Changes

- 7f2e19e: fixed an issue in which routes on the start page weren't rendered correctly in Windows

## 0.25.3

### Patch Changes

- 02676a8: Fix typescript-generator importStatements logic for relative paths

## 0.25.2

### Patch Changes

- 5523d0f: fixed another bug caused by backslashes in Windows

## 0.25.1

### Patch Changes

- 226ce37: fixed a couple more issues in Windows

## 0.25.0

### Minor Changes

- 5a9f40a: added a bunch more debug logging
- fix Windows issue where "http://" gets changed to "http:/" and as a result the app hangs

## 0.24.0

### Minor Changes

- e1bbb42: added a bit of debug logging (use environment variable DEBUG=counterfact to see it)
- 1ea478a: remove the dependency on ts-node -- path files are now compiled with Typescript and output to a paths-js directory

## 0.23.0

### Minor Changes

- 8ef5f41: Windows support! (maybe -- I don't have a Windows machine so I can't test directly)

## 0.22.0

### Minor Changes

- 4dcfa06: add CORS headers to support local development (Thanks, [dethell-jh](https://github.com/dethell-jh)!)

### Patch Changes

- dec64f4: Add CORS headers

## 0.21.3

### Patch Changes

- 1d13668: fix an issue where the random() function doesn't recognize it should use OpenAPI2

## 0.21.2

### Patch Changes

- 9ca754f: fix another bug where OpenAPI2 puts the produces proprty in the root

## 0.21.1

### Patch Changes

- 65f081b: fix error when the produces content type is defined at the root

## 0.21.0

### Minor Changes

- 9e0e4d3: it's Friday ¯\_(ツ)\_/¯

## 0.20.6

### Patch Changes

- d975833: fix an issue where ts-node was not being used, which basically broke everything

## 0.20.5

### Patch Changes

- 7d05529: fix $.proxy() -- it's better but still experimental

## 0.20.4

### Patch Changes

- 74c98aa: Fix: Found an error when headers name contains `-` (thanks [@hireza](https://github.com/hireza)!)

## 0.20.3

### Patch Changes

- d2a3023: fix issues which made --proxy-url completely broken

## 0.20.2

### Patch Changes

- 120eb52: fixes an issue where files may not be treated as ESM

## 0.20.1

### Patch Changes

- bb8f5f4: fix an issue causing all endpoints to return 404

## 0.20.0

### Minor Changes

- 3c78a07: support for enum values in schemas

### Patch Changes

- b2bf1db: fix duplicate imports of Context object
- 0f4ead6: don't import HTTPStatusCode if not needed
- 8e4410c: redirect /counterfact to counterfact/

## 0.19.1

### Patch Changes

- ab730a8: fix an issue where top-level produces in OpenAPI 2 was not working

## 0.19.0

### Minor Changes

- 196f7f4: new `--proxyURL <url>` CLI option and `.proxy [on|off]` command in the REPL

## 0.18.0

### Minor Changes

- 1244b6e: support for allOf, anyOf, oneOf, and not

### Patch Changes

- 1d360bd: OpenAPI 2 -- fall back to top-level produces and consumes

## 0.17.0

### Minor Changes

- 052db18: requires ts-node to be installed globally (for now)

## 0.16.0

### Minor Changes

- b99a1ed: fault tolerance: the server will not crash due to a syntax error
- b99a1ed: run TypeScript directly via ts-node loader instead of putting JS files on disk

## 0.15.1

### Patch Changes

- b7509d9: fix an issue where importing from $.context.ts did not work

## 0.15.0

### Minor Changes

- 78c0c31: return $.proxy(url) to proxy to another server
- 6bf3d42: $context.ts -> $.context.ts
- 7c2893a: change rapidoc configuration to show paths in the nav bar
- 033c067: new landing page with links to Rapidoc and Swagger UI
- 6bf3d42: improve and document the REPL

### Patch Changes

- a2d6bf0: always start the server regardless of which command line options are present
- 4a96dfa: fix crash when a path is not found

## 0.14.0

### Minor Changes

- b177d1d: rebuilt (but very rough) landing page using rapidoc

## 0.13.3

### Patch Changes

- 9e457bd: Add OpenApi2 host property support

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
