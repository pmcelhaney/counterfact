# Counterfact

This is a work in progress.

If you're nosy and don't mind a whole lot of incompleteness:

```sh
yarn
yarn test
yarn build
node dist/trial.js
```

Then open http://localhost:3000/hello and prepare to be underwhelmed.

## Features

- [x] Convention-over-configuration style API
- [x] un-opinionated with respect how you set up fake data and APIs
- [x] e.g. implement `GET /hello/world` by exporting a `GET()` function from `./hello/world.mjs`
- [ ] easily read the request (method, headers, body, path, query string) and send a response (status, headers, body, content type, etc.)
  - [x] fundamental, most commonly used parts
  - [ ] details
- [x] middleware to plug in to Koa
- [ ] can also be run as a stand-alone HTTP server via CLI
- [x] hot reload: add / remove / change a file and see results without restarting the server
- [x] convenient access to a store which has local state
  - [x] pure API (using reducers)
  - [x] side effect API
- [ ] set up test scenarios by populating a store using "migration scripts"
- [ ] configure the store through an API or a GUI to select migration scripts
- [ ] "record mode" to automatically generate migration scripts

## Non-functional requirements

- [x] Written in Typescript
- [x] Solid unit test coverage
- [ ] CI/CD pipeline
- [ ] Documentation
- [ ] Demo
- [ ] Publish to npm

As of Friday, April 15, 2022, all of the "hard" stuff is done (bleeding edge Node + Jest + TypeScript and most of hot reloading) and what remains is mostly drudgery. I'm aiming to finish hot reloading and put together a demo by EOD Monday (and hopefully more check some more boxes).
