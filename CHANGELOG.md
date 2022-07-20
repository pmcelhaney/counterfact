# counterfact

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
