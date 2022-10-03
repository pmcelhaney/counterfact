<div align="center">

# Counterfact

[![Coverage Status](https://coveralls.io/repos/github/pmcelhaney/counterfact/badge.svg)](https://coveralls.io/github/pmcelhaney/counterfact) [![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fpmcelhaney%2Fcounterfact%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/pmcelhaney/counterfact/main)

_Front end development without back end headaches_

[Uses](#uses) [Quick Start](#quick-start) | [Watch Demo](#watch-demo) | [Install](#install) | [Documentation](#documentation)

</div>

## Uses

Counterfact is a stand-in REST server powered by Node and TypeScript. It simulates complex back end behavior without running the whole stack. Use it to:

💪 build the front end before the back end or build both in parallel<br>
🏎️ quickly and cheaply prototype UX workflows<br>
🧑‍🔬 test front end code against hard-to-recreate edge cases<br>
⛓️ write fast, repeatable UI integration tests<br>
🎉 turn OpenAPI docs into functional code<br>
🔌 plug into your existing toolchain<br>

## Quick Start

Run this command to generate a server for the Swagger Pet Store.

```sh copy
npx counterfact@latest https://petstore3.swagger.io/api/v3/openapi.json api --open
```

You can replace the URL above with a link or file path pointing to your own OpenAPI v3 document. The only prequisite is [Node 16+](https://nodejs.org/en/).

### What should I expect?

The above command will:

1. install the `@latest` version of `counterfact`
2. read the OpenAPI document (`https://petstore3.swagger.io/api/v3/openapi.json`)
3. generate TypeScript files in the `api` directory
4. start a server which implements the API
5. open your browser to Swagger-UI (`--open`)

You can use Swagger to try out the auto-generated API. Out of the box, it returns random responses using metadata from the OpenAPI document. You can edit the files under `./api/paths` to add more realistic behavior. There's no need to restart the server.
